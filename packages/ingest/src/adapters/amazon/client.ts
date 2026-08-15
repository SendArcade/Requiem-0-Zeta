/**
 * Amazon US retail search — shelf/list prices (camelcamelcamel lane).
 * Not sold comps — active_ask provenance only.
 */
import crypto from "node:crypto";

const SEARCH_ORIGIN = "https://www.amazon.com";

/** Product Advertising API 5.0 search (when credentialed). */
const PA_API_SEARCH = "https://webservices.amazon.com/paapi5/searchitems";

export interface AmazonItem {
  asin: string;
  title: string;
  price: number;
  currency: "USD";
  url: string;
}

export interface AmazonSearchPage {
  items: AmazonItem[];
}

export interface AmazonClientOptions {
  minIntervalMs?: number;
  maxRetries?: number;
  timeoutMs?: number;
  userAgent?: string;
}

export class AmazonAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AmazonAccessError";
  }
}

export class AmazonRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AmazonRequestError";
  }
}

export function amazonItemUrl(asin: string): string {
  return `${SEARCH_ORIGIN}/dp/${asin}`;
}

export function searchUrl(query: string): string {
  return `${SEARCH_ORIGIN}/s?k=${encodeURIComponent(query)}`;
}

/** Parse Amazon search HTML for ASIN + price rows. */
export function parseAmazonSearchHtml(html: string): AmazonSearchPage {
  if (/captcha|Robot Check|Enter the characters you see/i.test(html.slice(0, 800))) {
    throw new AmazonAccessError("Amazon search blocked (captcha interstitial)");
  }

  const items: AmazonItem[] = [];
  const seen = new Set<string>();

  // Primary: data-asin blocks with a-offscreen price
  const blockRe =
    /data-asin="([A-Z0-9]{10})"[\s\S]{0,4000}?class="a-offscreen">\$([0-9,]+\.?[0-9]*)<\/span>[\s\S]{0,2000}?>([^<]{8,200})</gi;

  for (const match of html.matchAll(blockRe)) {
    const asin = match[1]!;
    const price = Number(match[2]!.replace(/,/g, ""));
    const title = match[3]!.replace(/\s+/g, " ").trim();
    if (!seen.has(asin) && title.length > 8 && Number.isFinite(price) && price > 0) {
      seen.add(asin);
      items.push({
        asin,
        title,
        price,
        currency: "USD",
        url: amazonItemUrl(asin),
      });
    }
  }

  if (items.length > 0) return { items };

  throw new Error("Amazon search: no priced ASIN rows found in HTML");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class AmazonClient {
  private readonly minIntervalMs: number;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private lastRequestAt = 0;

  constructor(opts: AmazonClientOptions = {}) {
    this.minIntervalMs = opts.minIntervalMs ?? 2_000;
    this.maxRetries = opts.maxRetries ?? 2;
    this.timeoutMs = opts.timeoutMs ?? 25_000;
    this.userAgent =
      opts.userAgent ??
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  }

  private paApiConfigured(): boolean {
    return Boolean(
      process.env.AMAZON_ACCESS_KEY?.trim() &&
        process.env.AMAZON_SECRET_KEY?.trim() &&
        process.env.AMAZON_PARTNER_TAG?.trim()
    );
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minIntervalMs) await sleep(this.minIntervalMs - elapsed);
    this.lastRequestAt = Date.now();
  }

  private async searchPaApi(query: string, maxItems: number): Promise<AmazonItem[]> {
    await this.throttle();
    const payload = {
      Keywords: query,
      SearchIndex: "All",
      ItemCount: Math.min(maxItems, 10),
      PartnerTag: process.env.AMAZON_PARTNER_TAG!.trim(),
      PartnerType: "Associates",
      Marketplace: "www.amazon.com",
      Resources: ["ItemInfo.Title", "Offers.Listings.Price"],
    };

    const res = await fetch(PA_API_SEARCH, {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "x-amz-target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
        "content-encoding": "amz-1.0",
        "user-agent": this.userAgent,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!res.ok) {
      throw new AmazonRequestError(`Amazon PA-API search ${res.status}`, res.status);
    }

    const json = (await res.json()) as {
      SearchResult?: {
        Items?: Array<{
          ASIN?: string;
          ItemInfo?: { Title?: { DisplayValue?: string } };
          Offers?: { Listings?: Array<{ Price?: { Amount?: number; DisplayAmount?: string } }> };
        }>;
      };
    };

    const items: AmazonItem[] = [];
    for (const row of json.SearchResult?.Items ?? []) {
      const asin = row.ASIN?.trim();
      const title = row.ItemInfo?.Title?.DisplayValue?.trim();
      const amount = row.Offers?.Listings?.[0]?.Price?.Amount;
      if (!asin || !title || typeof amount !== "number" || amount <= 0) continue;
      items.push({
        asin,
        title,
        price: amount,
        currency: "USD",
        url: amazonItemUrl(asin),
      });
      if (items.length >= maxItems) break;
    }
    return items;
  }

  private async searchHtml(query: string, maxItems: number): Promise<AmazonItem[]> {
    const url = searchUrl(query);
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      await this.throttle();
      try {
        const res = await fetch(url, {
          headers: {
            "user-agent": this.userAgent,
            accept: "text/html,application/xhtml+xml",
            "accept-language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        const html = await res.text();
        if (res.status === 503 || /captcha/i.test(html.slice(0, 500))) {
          throw new AmazonAccessError(`Amazon search blocked (${res.status})`);
        }
        if (!res.ok) {
          throw new AmazonRequestError(`Amazon search ${res.status}`, res.status);
        }
        return parseAmazonSearchHtml(html).items.slice(0, maxItems);
      } catch (err) {
        lastError = err;
        const retriable = err instanceof AmazonRequestError && err.status >= 500;
        if (!retriable || attempt === this.maxRetries) break;
        await sleep(this.minIntervalMs * (attempt + 1));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Amazon search failed: ${String(lastError)}`);
  }

  async searchRetail(
    query: string,
    opts: { maxItems?: number } = {}
  ): Promise<AmazonItem[]> {
    const maxItems = opts.maxItems ?? 20;
    if (this.paApiConfigured()) {
      try {
        return await this.searchPaApi(query, maxItems);
      } catch (err) {
        if (process.env.AMAZON_PAAPI_STRICT === "1") throw err;
        console.warn(
          `[amazon_us] PA-API failed (${(err as Error).message}); trying HTML`
        );
      }
    }
    return this.searchHtml(query, maxItems);
  }
}
