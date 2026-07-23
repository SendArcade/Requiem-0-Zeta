import type { Condition } from "@beyoracle/shared";

const CLOSED_SEARCH_URL =
  "https://auctions.yahoo.co.jp/closedsearch/closedsearch";

/** Yahoo caps a closed-search page at 100 rows. */
const MAX_PAGE_SIZE = 100;

/**
 * Yahoo's closed search (落札相場) is a Next.js page. The rendered markup uses
 * build-hashed class names, so we read the embedded `__NEXT_DATA__` payload
 * instead — it is the same data the page hydrates from and survives restyling.
 */
const NEXT_DATA_RE =
  /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;

export interface YahooItem {
  auctionId: string;
  title: string;
  price: number;
  bidCount: number;
  endTime: string;
  startTime?: string;
  itemCondition?: string;
  isFleamarketItem?: boolean;
  isFixedPrice?: boolean;
  seller?: { userId?: string; goodRating?: string; type?: string };
}

export interface YahooSearchPage {
  items: YahooItem[];
  totalResultsAvailable: number;
}

export interface YahooClientOptions {
  minIntervalMs?: number;
  maxRetries?: number;
  timeoutMs?: number;
  userAgent?: string;
}

/**
 * Yahoo grades condition as NEW / USED10..USED60, coarsest first.
 * USED10 is 未使用に近い; everything below it is visible wear.
 */
export function conditionFromYahoo(code: string | undefined): Condition {
  if (!code) return "unknown";
  if (code === "NEW") return "sealed";
  if (code === "USED10") return "like_new";
  if (code.startsWith("USED")) return "used";
  return "unknown";
}

/** Closed search mixes auctions with Yahoo!フリマ (PayPay Flea Market) rows. */
export function yahooItemUrl(item: YahooItem): string {
  return item.isFleamarketItem
    ? `https://paypayfleamarket.yahoo.co.jp/item/${item.auctionId}`
    : `https://auctions.yahoo.co.jp/jp/auction/${item.auctionId}`;
}

export class YahooRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "YahooRequestError";
  }
}

export function parseNextData(html: string): YahooSearchPage {
  const match = html.match(NEXT_DATA_RE);
  if (!match) {
    throw new Error("Yahoo closed search: __NEXT_DATA__ payload not found");
  }

  const parsed = JSON.parse(match[1]!) as {
    props?: {
      pageProps?: {
        initialState?: {
          search?: {
            items?: {
              listing?: {
                items?: YahooItem[];
                totalResultsAvailable?: number;
              };
            };
          };
        };
      };
    };
  };

  const listing =
    parsed.props?.pageProps?.initialState?.search?.items?.listing;

  if (!listing) {
    throw new Error("Yahoo closed search: listing payload missing");
  }

  return {
    items: listing.items ?? [],
    totalResultsAvailable: listing.totalResultsAvailable ?? 0,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Yahoo closed search returns HTTP 404 for letter-hyphen-letter tokens (e.g. "Absorb-S").
 * Replacing the hyphen with a space succeeds. Set YAHOO_NORMALIZE_HYPHEN_QUERIES=0 to disable.
 */
export function normalizeYahooKeyword(keyword: string): string {
  if (process.env.YAHOO_NORMALIZE_HYPHEN_QUERIES === "0") return keyword;
  return keyword.replace(/\b([A-Za-z]+)-([A-Za-z]+)\b/g, "$1 $2");
}

const EMPTY_SEARCH_PAGE: YahooSearchPage = {
  items: [],
  totalResultsAvailable: 0,
};

export class YahooAuctionsClient {
  private readonly minIntervalMs: number;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private lastRequestAt = 0;
  private sessionPrimed = false;

  constructor(opts: YahooClientOptions = {}) {
    this.minIntervalMs = opts.minIntervalMs ?? 1_500;
    this.maxRetries = opts.maxRetries ?? 3;
    this.timeoutMs = opts.timeoutMs ?? 20_000;
    this.userAgent =
      opts.userAgent ??
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  }

  /** Prime auction-domain cookies — reduces 404/500 on cold Railway egress. */
  private async primeSession(): Promise<void> {
    if (this.sessionPrimed) return;
    await fetch("https://auctions.yahoo.co.jp/", {
      headers: {
        "user-agent": this.userAgent,
        "accept-language": "ja",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    this.sessionPrimed = true;
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minIntervalMs) {
      await sleep(this.minIntervalMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  /** `b` is a 1-based row offset, `n` the page size. */
  async searchPage(
    keyword: string,
    opts: { begin?: number; pageSize?: number } = {}
  ): Promise<YahooSearchPage> {
    const { begin = 1, pageSize = MAX_PAGE_SIZE } = opts;
    const normalizedKeyword = normalizeYahooKeyword(keyword);

    const url = `${CLOSED_SEARCH_URL}?p=${encodeURIComponent(normalizedKeyword)}&n=${Math.min(
      pageSize,
      MAX_PAGE_SIZE
    )}&b=${begin}`;

    let lastError: unknown;

    await this.primeSession();

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      await this.throttle();

      try {
        const res = await fetch(url, {
          headers: {
            "user-agent": this.userAgent,
            "accept-language": "ja,en-US;q=0.9",
            accept: "text/html,application/xhtml+xml",
            referer: "https://auctions.yahoo.co.jp/",
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (res.status === 429 || res.status >= 500) {
          throw new YahooRequestError(
            `Yahoo closed search failed with ${res.status}`,
            res.status
          );
        }

        const html = await res.text();

        // Yahoo uses 404 for zero-hit queries (payload still has __NEXT_DATA__).
        if (res.status === 404) {
          try {
            return parseNextData(html);
          } catch {
            return EMPTY_SEARCH_PAGE;
          }
        }

        if (!res.ok) {
          throw new YahooRequestError(
            `Yahoo closed search rejected with ${res.status}`,
            res.status
          );
        }

        return parseNextData(html);
      } catch (err) {
        lastError = err;

        const retriable =
          err instanceof YahooRequestError
            ? err.status === 429 || err.status >= 500
            : true;

        if (!retriable || attempt === this.maxRetries) break;

        await sleep(this.minIntervalMs * Math.pow(2, attempt));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Yahoo closed search failed: ${String(lastError)}`);
  }

  /**
   * Closed search only lists completed sales, but a zero-bid auction row means
   * nobody bought it — that is not a comp. Flea-market rows are fixed-price and
   * only appear once sold.
   */
  async searchSold(
    keyword: string,
    opts: { maxItems?: number; maxPages?: number } = {}
  ): Promise<YahooItem[]> {
    const { maxItems = 100, maxPages = 5 } = opts;

    const collected: YahooItem[] = [];
    const seen = new Set<string>();

    for (let page = 0; page < maxPages && collected.length < maxItems; page++) {
      const { items } = await this.searchPage(keyword, {
        begin: page * MAX_PAGE_SIZE + 1,
        pageSize: MAX_PAGE_SIZE,
      });

      if (items.length === 0) break;

      for (const item of items) {
        if (seen.has(item.auctionId)) continue;
        if (!item.isFleamarketItem && item.bidCount < 1) continue;

        seen.add(item.auctionId);
        collected.push(item);
        if (collected.length >= maxItems) break;
      }
    }

    return collected;
  }
}
