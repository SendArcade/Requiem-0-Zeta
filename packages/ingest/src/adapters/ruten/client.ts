/** Semi-public rtapi search — pattern from Apify ruten-scraper / Ruten desktop-search bundle. */
export const RUTEN_SEARCH_URL =
  "https://rtapi.ruten.com.tw/api/search/v3/index.php/core/prod";

export const RUTEN_PROD_URL =
  "https://rtapi.ruten.com.tw/api/prod/v3/index.php/prod";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class RutenAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RutenAccessError";
  }
}

export interface RutenClientOptions {
  timeoutMs?: number;
  userAgent?: string;
  minIntervalMs?: number;
}

/** Search row — v3 returns Id stubs; prod batch fills title/price. */
export interface RutenSearchRow {
  Id: string;
}

export interface RutenSearchResponse {
  TotalRows?: number;
  Rows?: RutenSearchRow[];
  LimitedTotalRows?: number;
}

/** prod/v3 batch row — field names from rtapi (Apify ruten-scraper). */
export interface RutenProdRow {
  ProdId: string;
  ProdName: string;
  PriceRange: [number, number];
  SoldQty?: number;
  StockQty?: number;
  Currency?: string;
  PostTime?: string;
  SellerId?: string;
  CateId?: string;
  ShippingCost?: number;
  StockStatus?: number;
}

export interface RutenItem {
  gNo: string;
  title: string;
  priceTwd: number;
  priceRangeMax?: number;
  soldCount: number;
  stockQty?: number;
  url: string;
  postTime?: string;
  sellerId?: string;
  cateId?: string;
  shippingCost?: number;
}

export function rutenItemUrl(gNo: string): string {
  return `https://www.ruten.com.tw/item/show?${gNo}`;
}

/** rtapi offset is 1-based; offset=0 returns HTTP 400. */
export function normalizeSearchOffset(offset?: number): number {
  const raw = offset ?? 1;
  return raw < 1 ? 1 : raw;
}

export function parseSearchIds(
  payload: RutenSearchResponse,
  limit = 50
): string[] {
  const rows = payload.Rows ?? [];
  const ids: string[] = [];

  for (const row of rows) {
    const id = row.Id?.trim();
    if (!id) continue;
    ids.push(id);
    if (ids.length >= limit) break;
  }

  return ids;
}

function parsePostTime(postTime?: string): string | undefined {
  if (!postTime?.trim()) return undefined;
  const m = postTime.trim().match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return undefined;
  const [, y, mo, d, h, mi, s] = m;
  const dt = new Date(
    Date.UTC(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h) - 8,
      Number(mi),
      Number(s)
    )
  );
  return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString();
}

/**
 * Maps prod/v3 batch JSON to normalized items.
 * Price uses PriceRange[0] (floor); SoldQty is cumulative sold_count.
 */
export function parseProdRows(payload: RutenProdRow[], limit = 50): RutenItem[] {
  const items: RutenItem[] = [];

  for (const row of payload) {
    const gNo = row.ProdId?.trim();
    const title = row.ProdName?.trim();
    const priceTwd = row.PriceRange?.[0];

    if (!gNo || !title || priceTwd == null || Number.isNaN(Number(priceTwd))) {
      continue;
    }

    items.push({
      gNo,
      title,
      priceTwd: Number(priceTwd),
      priceRangeMax:
        row.PriceRange.length > 1 ? Number(row.PriceRange[1]) : undefined,
      soldCount: Number(row.SoldQty ?? 0),
      stockQty: row.StockQty != null ? Number(row.StockQty) : undefined,
      url: rutenItemUrl(gNo),
      postTime: parsePostTime(row.PostTime),
      sellerId: row.SellerId,
      cateId: row.CateId,
      shippingCost:
        row.ShippingCost != null ? Number(row.ShippingCost) : undefined,
    });

    if (items.length >= limit) break;
  }

  if (items.length === 0 && payload.length > 0) {
    throw new RutenAccessError(
      "Ruten TW prod batch returned rows but none parsed cleanly"
    );
  }

  return items;
}

/**
 * Ruten TW semi-public JSON search + prod batch enrichment.
 * Search: rtapi search/v3 (q, limit, offset, sort=rnk/dc).
 * Details: rtapi prod/v3 batch by comma-separated ids.
 */
export class RutenClient {
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private readonly minIntervalMs: number;
  private lastRequestAt = 0;

  constructor(opts: RutenClientOptions = {}) {
    this.timeoutMs =
      opts.timeoutMs ?? Number(process.env.RUTEN_TIMEOUT_MS ?? 45_000);
    this.minIntervalMs =
      opts.minIntervalMs ??
      Number(process.env.RUTEN_MIN_INTERVAL_MS ?? 1_500);
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

  private async fetchJson<T>(url: string): Promise<T> {
    await this.throttle();

    const res = await fetch(url, {
      headers: {
        "user-agent": this.userAgent,
        accept: "application/json, text/plain, */*",
        referer: "https://www.ruten.com.tw/",
        origin: "https://www.ruten.com.tw",
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const body = await res.text();

    if (!res.ok) {
      throw new RutenAccessError(
        `Ruten TW request failed with HTTP ${res.status}: ${body.slice(0, 200)}`
      );
    }

    try {
      return JSON.parse(body) as T;
    } catch {
      throw new RutenAccessError(
        `Ruten TW returned non-JSON body: ${body.slice(0, 200)}`
      );
    }
  }

  private buildSearchUrl(
    keyword: string,
    limit: number,
    offset: number
  ): string {
    const params = new URLSearchParams({
      q: keyword,
      limit: String(Math.min(Math.max(limit, 1), 80)),
      offset: String(normalizeSearchOffset(offset)),
      sort: "rnk/dc",
    });
    return `${RUTEN_SEARCH_URL}?${params.toString()}`;
  }

  private buildProdUrl(ids: string[]): string {
    const params = new URLSearchParams({ id: ids.join(",") });
    return `${RUTEN_PROD_URL}?${params.toString()}`;
  }

  async searchItems(
    keyword: string,
    opts: { limit?: number; offset?: number } = {}
  ): Promise<RutenItem[]> {
    const limit = opts.limit ?? 50;
    const offset = normalizeSearchOffset(opts.offset);

    const searchPayload = await this.fetchJson<RutenSearchResponse>(
      this.buildSearchUrl(keyword, limit, offset)
    );

    const ids = parseSearchIds(searchPayload, limit);
    if (ids.length === 0) return [];

    const prodPayload = await this.fetchJson<RutenProdRow[]>(
      this.buildProdUrl(ids)
    );

    if (!Array.isArray(prodPayload)) {
      throw new RutenAccessError(
        "Ruten TW prod batch returned unexpected payload shape"
      );
    }

    return parseProdRows(prodPayload, limit);
  }
}
