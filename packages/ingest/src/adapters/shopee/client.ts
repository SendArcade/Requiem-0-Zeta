const SEARCH_URL = "https://shopee.tw/api/v4/search/search_items";

export class ShopeeAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopeeAccessError";
  }
}

export interface ShopeeClientOptions {
  timeoutMs?: number;
  userAgent?: string;
}

/**
 * Shopee's public search API is protected by request signing and device
 * fingerprinting. Unauthenticated calls return HTTP 403 / error 90309999.
 * A commercial parser (ShopAPIS, Bright Data) or a browser session with
 * valid cookies is required for production live ingest.
 */
export class ShopeeClient {
  private readonly timeoutMs: number;
  private readonly userAgent: string;

  constructor(opts: ShopeeClientOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? 15_000;
    this.userAgent =
      opts.userAgent ??
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  }

  async searchItems(
    keyword: string,
    opts: { limit?: number } = {}
  ): Promise<never> {
    const limit = opts.limit ?? 50;
    const url = `${SEARCH_URL}?by=relevancy&keyword=${encodeURIComponent(
      keyword
    )}&limit=${limit}&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;

    const res = await fetch(url, {
      headers: {
        "user-agent": this.userAgent,
        accept: "application/json",
        "x-api-source": "pc",
        "x-requested-with": "XMLHttpRequest",
        referer: "https://shopee.tw/",
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const body = await res.text();

    if (res.status === 403 || body.includes("90309999")) {
      throw new ShopeeAccessError(
        "Shopee TW blocked the request (403 / anti-bot). Live ingest needs a " +
          "commercial parser (ShopAPIS, Bright Data) or a browser session with " +
          "valid cookies — the unsigned public API path is not viable."
      );
    }

    if (!res.ok) {
      throw new ShopeeAccessError(
        `Shopee TW search failed with HTTP ${res.status}: ${body.slice(0, 200)}`
      );
    }

    // If Shopee ever stops blocking, parse items here. Today this is unreachable.
    throw new ShopeeAccessError(
      "Shopee TW returned 200 but item parsing is not implemented yet"
    );
  }
}
