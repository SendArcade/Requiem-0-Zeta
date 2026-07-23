/** Mandarake JP retail search — parse pattern from msikma/mdrscr (Cheerio selectors → regex). */
export const MANDARAKE_SEARCH_URL =
  "https://order.mandarake.co.jp/order/listPage/list";

export const MANDARAKE_ORDER_HOME = "https://order.mandarake.co.jp/order/?lang=ja";

/** mdrscr: soldOut=0 shows sold-out rows; soldOut=1 hides them (available ask). */
const IN_STOCK_JA = "在庫あります";
const IN_STOREFRONT_JA = "在庫確認します";
const SOLD_OUT_JA = "売り切れ";

/** Split on block starts — live HTML may omit `<!-- /block -->` comments. */
function extractMandarakeBlocks(html: string): string[] {
  const marker = /<div\s+class="block"/gi;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = marker.exec(html)) !== null) {
    starts.push(m.index);
  }
  if (starts.length === 0) return [];

  const blocks: string[] = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i]!;
    const end = i + 1 < starts.length ? starts[i + 1]! : html.length;
    blocks.push(html.slice(start, end));
  }
  return blocks;
}

const ITEM_IDX_RE = /data-itemidx="(\d+)"/;
const ITEM_CODE_URL_RE = /itemCode=(\d+)/;
const TITLE_LINK_RE =
  /<div class="title">\s*<p>\s*(?:<a[^>]*>)?\s*([\s\S]*?)\s*(?:<\/a>)?\s*<\/p>/;
const PRICE_RE = /([0-9,]+)円/;
const ITEM_NO_RE = /<p class="itemno">([^<]+)<\/p>/;
const SHOP_RE = /<p class="shop">([^<]+)<\/p>/;
const STOCK_RE = /<p class="stock">([^<]+)<\/p>/;
const DETAIL_HREF_RE =
  /<div class="pic">[\s\S]*?<a href="([^"]+detailPage\/item[^"]+)"/;
const ADULT_LINK_RE = /class="adult_link"[^>]*id="([^"]+)"/;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MandarakeAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MandarakeAccessError";
  }
}

export interface MandarakeClientOptions {
  timeoutMs?: number;
  userAgent?: string;
  minIntervalMs?: number;
}

export interface MandarakeItem {
  itemCode: string;
  title: string;
  priceJpy: number;
  soldOut: boolean;
  url: string;
  itemNo?: string[];
  shop?: string;
  stockText?: string;
}

export function mandarakeItemUrl(itemCode: string): string {
  return `https://order.mandarake.co.jp/order/detailPage/item?itemCode=${encodeURIComponent(itemCode)}`;
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

function parseItemNo(raw: string): string[] {
  const trimmed = raw.trim();
  const paren = trimmed.match(/^(.+?)\s*\(([0-9-]+)\)$/);
  if (paren) return [paren[1]!.trim(), paren[2]!];
  return [trimmed];
}

function absoluteDetailUrl(href: string): string {
  const decoded = decodeHtml(href);
  if (decoded.startsWith("http")) return decoded;
  return `https://order.mandarake.co.jp${decoded.startsWith("/") ? "" : "/"}${decoded}`;
}

function itemCodeFromBlock(block: string): string | null {
  const idx = block.match(ITEM_IDX_RE)?.[1];
  if (idx) return idx;

  const href = block.match(DETAIL_HREF_RE)?.[1];
  if (href) {
    const fromUrl = href.match(ITEM_CODE_URL_RE)?.[1];
    if (fromUrl) return fromUrl;
  }

  const adult = block.match(ADULT_LINK_RE)?.[1];
  return adult ?? null;
}

function isSoldOutBlock(block: string, stockText: string | undefined): boolean {
  if (/<div class="soldout">/.test(block)) return true;
  if (stockText === IN_STOCK_JA || stockText === IN_STOREFRONT_JA) return false;
  if (stockText === SOLD_OUT_JA) return true;
  // Sold-out filter pages omit .stock and show .soldout; ask pages show cart controls.
  return !stockText && !/<div class="addcart">/.test(block);
}

/**
 * Parses Mandarake listPage HTML (`.thumlarge .block` rows).
 * Pattern adapted from msikma/mdrscr `fetchMandarakeSearch`.
 */
export function parseSearchHtml(html: string, limit = 240): MandarakeItem[] {
  if (isGeoBlockedLanding(html)) {
    throw new MandarakeAccessError(
      "Mandarake JP returned geo/language gate page instead of search results"
    );
  }

  const items: MandarakeItem[] = [];

  for (const block of extractMandarakeBlocks(html)) {
    const itemCode = itemCodeFromBlock(block);
    const titleMatch = block.match(TITLE_LINK_RE);
    const priceJpy = parsePrice(block);

    if (!itemCode || !titleMatch || priceJpy == null) continue;

    const stockText = block.match(STOCK_RE)?.[1]?.trim();
    const href = block.match(DETAIL_HREF_RE)?.[1];
    const url = href ? absoluteDetailUrl(href) : mandarakeItemUrl(itemCode);

    items.push({
      itemCode,
      title: decodeHtml(titleMatch[1]!),
      priceJpy,
      soldOut: isSoldOutBlock(block, stockText),
      url,
      itemNo: block.match(ITEM_NO_RE)
        ? parseItemNo(block.match(ITEM_NO_RE)![1]!)
        : undefined,
      shop: block.match(SHOP_RE)?.[1]?.trim(),
      stockText,
    });

    if (items.length >= limit) break;
  }

  if (items.length === 0 && html.includes("thumlarge")) {
    throw new MandarakeAccessError(
      "Mandarake JP search page contained rows but none parsed cleanly"
    );
  }

  return items;
}

/** Redirect to www.mandarake.co.jp landing when order search is geo-blocked. */
export function isGeoBlockedLanding(html: string): boolean {
  return (
    html.includes('class="select_sp"') &&
    html.includes("img/global/logo.png") &&
    !html.includes("thumlarge")
  );
}

/**
 * Mandarake order.mandarake.co.jp search — sold-out and in-stock retail listings.
 * Auction results live at ekizo.mandarake.co.jp (separate surface).
 */
export class MandarakeClient {
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private readonly minIntervalMs: number;
  private lastRequestAt = 0;
  private sessionPrimed = false;
  private cookies = new Map<string, string>();

  constructor(opts: MandarakeClientOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? 15_000;
    this.minIntervalMs =
      opts.minIntervalMs ?? Number(process.env.MANDARAKE_MIN_INTERVAL_MS ?? 1_500);
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

  private storeCookies(res: Response): void {
    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : [];

    for (const raw of setCookies) {
      const pair = raw.split(";")[0];
      if (!pair) continue;
      const eq = pair.indexOf("=");
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (name) this.cookies.set(name, value);
    }
  }

  private cookieHeader(): string | undefined {
    if (this.cookies.size === 0) return undefined;
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  private async fetchText(url: string, init: RequestInit = {}): Promise<string> {
    await this.throttle();

    const cookie = this.cookieHeader();
    const res = await fetch(url, {
      ...init,
      redirect: "follow",
      headers: {
        "user-agent": this.userAgent,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "ja,en;q=0.8",
        referer: "https://order.mandarake.co.jp/",
        ...(cookie ? { cookie } : {}),
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    this.storeCookies(res);
    const body = await res.text();

    if (!res.ok) {
      throw new MandarakeAccessError(
        `Mandarake JP search failed with HTTP ${res.status}: ${body.slice(0, 200)}`
      );
    }

    return body;
  }

  /** Prime order-domain cookies so list search is not redirected to the global gate. */
  private async primeSession(): Promise<void> {
    if (this.sessionPrimed) return;
    await this.fetchText(MANDARAKE_ORDER_HOME);
    this.sessionPrimed = true;
  }

  async searchItems(
    keyword: string,
    opts: { limit?: number; includeSoldOut?: boolean } = {}
  ): Promise<MandarakeItem[]> {
    const limit = opts.limit ?? 50;
    const soldOutParam = opts.includeSoldOut === false ? "0" : "1";

    await this.primeSession();

    const params = new URLSearchParams({
      keyword,
      soldOut: soldOutParam,
      lang: "ja",
      dispCount: String(Math.min(Math.max(limit, 1), 240)),
    });
    const url = `${MANDARAKE_SEARCH_URL}?${params.toString()}`;

    const body = await this.fetchText(url);
    return parseSearchHtml(body, limit);
  }
}
