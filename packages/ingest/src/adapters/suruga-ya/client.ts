/** Suruga-ya JP product search — pattern from suruguya PyPI / datalab-jp scraper. */
export const SURUGAYA_SEARCH_URL = "https://www.suruga-ya.jp/search";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Skip kaitori (buyback) URLs — sell-side quotes, not buyer comps. */
const KAITORI_RE = /\/kaitori\//i;

const PRODUCT_LINK_RE =
  /<a[^>]*href="([^"]*\/product\/detail\/(\d+)[^"]*)"([^>]*)>([\s\S]*?)<\/a>/gi;

const TITLE_ATTR_ON_ANCHOR_RE = /title="([^"]+)"/;
const PRICE_RE = /([0-9,]+)円/;
const SOLDOUT_RE = /class="[^"]*soldout|売り切れ|在庫なし/i;

export class SurugaYaAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SurugaYaAccessError";
  }
}

export interface SurugaYaClientOptions {
  timeoutMs?: number;
  userAgent?: string;
  minIntervalMs?: number;
}

export interface SurugaYaItem {
  productId: string;
  title: string;
  priceJpy: number;
  inStock: boolean;
  url: string;
}

export function surugaYaProductUrl(productId: string): string {
  return `https://www.suruga-ya.jp/product/detail/${productId}`;
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(block: string): number | null {
  const match = block.match(PRICE_RE);
  if (!match) return null;
  return Number(match[1]!.replace(/,/g, ""));
}

function titleFromAnchor(attrs: string, innerHtml: string): string | null {
  const attr = attrs.match(TITLE_ATTR_ON_ANCHOR_RE)?.[1];
  if (attr) return decodeHtml(attr);
  const text = decodeHtml(innerHtml.replace(/<[^>]+>/g, ""));
  return text.length > 0 ? text : null;
}

/**
 * Parses Suruga-ya search HTML (product/detail links + nearby price).
 * Pattern adapted from community suruguya / datalab-jp scrapers.
 */
export function parseSearchHtml(html: string, limit = 50): SurugaYaItem[] {
  const items: SurugaYaItem[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(PRODUCT_LINK_RE)) {
    const href = match[1]!;
    if (KAITORI_RE.test(href)) continue;

    const productId = match[2]!;
    if (seen.has(productId)) continue;
    seen.add(productId);

    const attrs = match[3] ?? "";
    const inner = match[4] ?? "";
    const title = titleFromAnchor(attrs, inner);
    const start = match.index ?? 0;
    let end = start + 400;
    const rest = html.slice(start + href.length);
    const nextLink = rest.search(/\/product\/detail\/\d+/);
    if (nextLink >= 0) {
      end = start + href.length + nextLink;
    }
    const window = html.slice(start, end);
    const priceJpy = parsePrice(window);
    if (!title || priceJpy == null || priceJpy <= 0) continue;

    items.push({
      productId,
      title,
      priceJpy,
      inStock: !SOLDOUT_RE.test(window),
      url: surugaYaProductUrl(productId),
    });

    if (items.length >= limit) break;
  }

  return items;
}

export class SurugaYaClient {
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private readonly minIntervalMs: number;
  private lastRequestAt = 0;

  constructor(opts: SurugaYaClientOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? 15_000;
    this.minIntervalMs =
      opts.minIntervalMs ??
      Number(process.env.SURUGAYA_MIN_INTERVAL_MS ?? 1_500);
    this.userAgent =
      opts.userAgent ??
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minIntervalMs) {
      await sleep(this.minIntervalMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  async searchItems(
    keyword: string,
    opts: { limit?: number } = {}
  ): Promise<SurugaYaItem[]> {
    const limit = opts.limit ?? 50;
    const params = new URLSearchParams({
      search_word: keyword,
      searchbox: "1",
      category: "",
    });
    const url = `${SURUGAYA_SEARCH_URL}?${params.toString()}`;

    await this.throttle();

    const res = await fetch(url, {
      headers: {
        "user-agent": this.userAgent,
        accept: "text/html,application/xhtml+xml",
        referer: "https://www.suruga-ya.jp/",
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const body = await res.text();

    if (!res.ok) {
      throw new SurugaYaAccessError(
        `Suruga-ya JP search failed with HTTP ${res.status}: ${body.slice(0, 200)}`
      );
    }

    const items = parseSearchHtml(body, limit);
    if (items.length === 0 && body.length > 500) {
      throw new SurugaYaAccessError(
        "Suruga-ya JP returned 200 but no product rows parsed — HTML layout may have changed"
      );
    }

    return items;
  }
}
