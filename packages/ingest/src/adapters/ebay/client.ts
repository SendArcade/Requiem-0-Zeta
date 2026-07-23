/**
 * eBay US sold search — self-scrape of LH_Sold=1&LH_Complete=1 results.
 * Free path (no Apify). Datacenter IPs often get blocked; fixtures + retry from residential.
 * Pattern: Yahoo closed-search HTML adapter.
 */

const DEFAULT_ORIGIN = "https://www.ebay.com";

export interface EbayItem {
  itemId: string;
  title: string;
  price: number;
  currency: "USD";
  url: string;
  soldAt: string | null;
  listingType?: "auction" | "fixed_price" | "unknown";
}

export interface EbaySearchPage {
  items: EbayItem[];
}

export interface EbayClientOptions {
  origin?: string;
  minIntervalMs?: number;
  maxRetries?: number;
  timeoutMs?: number;
  userAgent?: string;
}

export class EbayAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EbayAccessError";
  }
}

export class EbayRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "EbayRequestError";
  }
}

export function ebayItemUrl(itemId: string, origin = DEFAULT_ORIGIN): string {
  return `${origin}/itm/${itemId}`;
}

export function soldSearchUrl(
  query: string,
  opts?: { page?: number; perPage?: number; origin?: string }
): string {
  const origin = opts?.origin ?? DEFAULT_ORIGIN;
  const params = new URLSearchParams({
    _nkw: query,
    LH_Sold: "1",
    LH_Complete: "1",
    _sop: "13",
    _ipg: String(opts?.perPage ?? 60),
    _pgn: String(opts?.page ?? 1),
  });
  return `${origin}/sch/i.html?${params.toString()}`;
}

export function isBlockedPage(html: string): boolean {
  return (
    /error-header__headline|Something went wrong on our end/i.test(html) ||
    /Pardon Our Interruption|security measure/i.test(html)
  );
}

function parsePrice(raw: string): number | null {
  const m = raw.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseSoldDate(chunk: string): string | null {
  const m = chunk.match(
    /Sold\s+([A-Za-z]{3}\s+\d{1,2},\s+\d{4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i
  );
  if (!m) return null;
  const d = new Date(m[1]!);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse sold search HTML — s-item cards or /itm/ link windows. */
export function parseSearchHtml(html: string, limit = 50): EbayItem[] {
  if (isBlockedPage(html)) {
    throw new EbayAccessError("eBay sold search blocked or error page");
  }

  const items: EbayItem[] = [];
  const seen = new Set<string>();

  const blockRe =
    /<li[^>]*class="[^"]*(?:s-item|s-card)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;

  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockRe.exec(html)) !== null && items.length < limit) {
    const chunk = blockMatch[1]!;
    const idMatch = chunk.match(/\/itm\/(\d{10,})/);
    if (!idMatch) continue;
    const itemId = idMatch[1]!;
    if (seen.has(itemId)) continue;

    const titleMatch =
      chunk.match(/role="heading"[^>]*>([\s\S]*?)<\//i) ??
      chunk.match(/class="[^"]*s-item__title[^"]*"[^>]*>([\s\S]*?)<\//i) ??
      chunk.match(/class="[^"]*s-card__title[^"]*"[^>]*>([\s\S]*?)<\//i);
    const title = titleMatch ? stripTags(titleMatch[1]!) : "";
    if (!title || /shop on ebay|new listing/i.test(title)) continue;

    const priceMatch =
      chunk.match(/class="[^"]*s-item__price[^"]*"[^>]*>([\s\S]*?)<\//i) ??
      chunk.match(/class="[^"]*s-card__price[^"]*"[^>]*>([\s\S]*?)<\//i);
    const price = priceMatch ? parsePrice(stripTags(priceMatch[1]!)) : null;
    if (price == null) continue;

    seen.add(itemId);
    items.push({
      itemId,
      title,
      price,
      currency: "USD",
      url: ebayItemUrl(itemId),
      soldAt: parseSoldDate(chunk),
      listingType: /Best offer accepted/i.test(chunk)
        ? "fixed_price"
        : /\bbids?\b/i.test(chunk)
          ? "auction"
          : "unknown",
    });
  }

  if (items.length === 0) {
    for (const m of html.matchAll(/\/itm\/(\d{10,})/g)) {
      if (items.length >= limit) break;
      const itemId = m[1]!;
      if (seen.has(itemId)) continue;
      const start = Math.max(0, m.index! - 400);
      const end = Math.min(html.length, m.index! + 1200);
      const chunk = html.slice(start, end);
      const titleMatch = chunk.match(/>([^<]{10,120})<\//);
      const title = titleMatch ? stripTags(titleMatch[1]!) : `eBay item ${itemId}`;
      const priceMatch = chunk.match(/\$[\d,]+(?:\.\d{2})?/);
      const price = priceMatch ? parsePrice(priceMatch[0]) : null;
      if (price == null) continue;
      if (/shop on ebay/i.test(title)) continue;
      seen.add(itemId);
      items.push({
        itemId,
        title,
        price,
        currency: "USD",
        url: ebayItemUrl(itemId),
        soldAt: parseSoldDate(chunk),
        listingType: "unknown",
      });
    }
  }

  if (items.length === 0 && /s-item|s-card|itm\//i.test(html)) {
    throw new Error("eBay sold search: page loaded but no items parsed");
  }

  return items.slice(0, limit);
}

export class EbayClient {
  private lastFetchAt = 0;
  private readonly origin: string;
  private readonly minIntervalMs: number;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly userAgent: string;

  constructor(opts: EbayClientOptions = {}) {
    this.origin = opts.origin ?? process.env.EBAY_ORIGIN ?? DEFAULT_ORIGIN;
    this.minIntervalMs = opts.minIntervalMs ?? Number(process.env.EBAY_MIN_INTERVAL_MS ?? 2_000);
    this.maxRetries = opts.maxRetries ?? 2;
    this.timeoutMs = opts.timeoutMs ?? Number(process.env.EBAY_TIMEOUT_MS ?? 25_000);
    this.userAgent =
      opts.userAgent ??
      process.env.EBAY_USER_AGENT ??
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
  }

  async searchSold(
    query: string,
    opts?: { maxItems?: number; maxPages?: number }
  ): Promise<EbayItem[]> {
    const maxItems = opts?.maxItems ?? 50;
    const maxPages = opts?.maxPages ?? Number(process.env.EBAY_MAX_PAGES ?? 3);
    const out: EbayItem[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= maxPages && out.length < maxItems; page++) {
      const html = await this.fetchText(
        soldSearchUrl(query, { page, perPage: 60, origin: this.origin })
      );
      const pageItems = parseSearchHtml(html, maxItems - out.length);
      for (const item of pageItems) {
        if (seen.has(item.itemId)) continue;
        seen.add(item.itemId);
        out.push(item);
        if (out.length >= maxItems) break;
      }
      if (pageItems.length === 0) break;
    }

    return out;
  }

  private async fetchText(url: string): Promise<string> {
    await this.politeWait();
    let lastErr: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          headers: {
            "user-agent": this.userAgent,
            accept: "text/html,application/xhtml+xml",
            "accept-language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (res.status === 404) return "";
        if (!res.ok) {
          throw new EbayRequestError(`HTTP ${res.status}`, res.status);
        }

        return await res.text();
      } catch (err) {
        lastErr = err as Error;
        if (attempt < this.maxRetries) {
          await sleep(800 * (attempt + 1));
        }
      }
    }

    throw lastErr ?? new Error("eBay fetch failed");
  }

  private async politeWait(): Promise<void> {
    const elapsed = Date.now() - this.lastFetchAt;
    if (elapsed < this.minIntervalMs) {
      await sleep(this.minIntervalMs - elapsed);
    }
    this.lastFetchAt = Date.now();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
