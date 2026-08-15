import crypto from "node:crypto";

/**
 * Walmart US retail search — shelf/online ask prices (not sold comps).
 * Pattern: CamelMart / camelcamelcamel sibling tracks Walmart list price history;
 * we read walmart.com search (or Affiliate API when credentialed).
 * Attribution: camelmart.com price-tracker shape — docs/ATTRIBUTIONS.md
 */

const SEARCH_ORIGIN = "https://www.walmart.com";

/** Affiliate search JSON shape (Walmart I/O Content Provider). */
const AFFILIATE_SEARCH =
  "https://developer.api.walmart.com/api-proxy/service/affil/product/v2/search";

export interface WalmartItem {
  itemId: string;
  title: string;
  price: number;
  currency: "USD";
  url: string;
  /** walmart | marketplace_new | marketplace_used */
  priceType?: string;
}

export interface WalmartSearchPage {
  items: WalmartItem[];
}

export interface WalmartClientOptions {
  minIntervalMs?: number;
  maxRetries?: number;
  timeoutMs?: number;
  userAgent?: string;
}

export class WalmartAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalmartAccessError";
  }
}

export class WalmartRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "WalmartRequestError";
  }
}

export function walmartItemUrl(itemId: string): string {
  return `${SEARCH_ORIGIN}/ip/${itemId}`;
}

export function searchUrl(query: string): string {
  return `${SEARCH_ORIGIN}/search?q=${encodeURIComponent(query)}`;
}

/** Parse embedded search JSON from HTML (__NEXT_DATA__ or Redux bootstrap). */
export function parseWalmartSearchPayload(text: string): WalmartSearchPage {
  const next = text.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (next) {
    const parsed = parseItemsFromUnknownJson(JSON.parse(next[1]!));
    if (parsed.length > 0) return { items: parsed };
  }

  const redux = text.match(/window\.__WML_REDUX_INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/);
  if (redux) {
    const parsed = parseItemsFromUnknownJson(JSON.parse(redux[1]!));
    if (parsed.length > 0) return { items: parsed };
  }

  if (/blocked|Just a moment|Robot or human/i.test(text.slice(0, 500))) {
    throw new WalmartAccessError("Walmart search blocked (bot interstitial)");
  }

  throw new Error("Walmart search: product JSON payload not found");
}

function readPrice(node: Record<string, unknown>): number | null {
  const paths: unknown[] = [
    node.salePrice,
    node.price,
    node.currentPrice,
    (node.priceInfo as Record<string, unknown> | undefined)?.currentPrice,
    ((node.priceInfo as Record<string, unknown> | undefined)?.currentPrice as Record<
      string,
      unknown
    >)?.price,
  ];

  for (const candidate of paths) {
    if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
    if (typeof candidate === "string") {
      const n = Number(candidate);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

function mapRawItem(node: Record<string, unknown>): WalmartItem | null {
  const itemId = String(node.usItemId ?? node.itemId ?? node.id ?? "").trim();
  const title = String(node.name ?? node.title ?? "").trim();
  const price = readPrice(node);
  if (!itemId || !title || price == null) return null;

  return {
    itemId,
    title,
    price,
    currency: "USD",
    url: walmartItemUrl(itemId),
    priceType:
      typeof node.priceType === "string"
        ? node.priceType
        : typeof node.offerType === "string"
          ? node.offerType
          : undefined,
  };
}

function parseItemsFromUnknownJson(root: unknown): WalmartItem[] {
  const items: WalmartItem[] = [];
  const seen = new Set<string>();

  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const entry of node) visit(entry);
      return;
    }

    const record = node as Record<string, unknown>;
    const maybe = mapRawItem(record);
    if (maybe && !seen.has(maybe.itemId)) {
      seen.add(maybe.itemId);
      items.push(maybe);
    }

    for (const value of Object.values(record)) {
      if (value && typeof value === "object") visit(value);
    }
  };

  visit(root);
  return items;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class WalmartClient {
  private readonly minIntervalMs: number;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private lastRequestAt = 0;

  constructor(opts: WalmartClientOptions = {}) {
    this.minIntervalMs = opts.minIntervalMs ?? 1_500;
    this.maxRetries = opts.maxRetries ?? 2;
    this.timeoutMs = opts.timeoutMs ?? 20_000;
    this.userAgent =
      opts.userAgent ??
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minIntervalMs) {
      await sleep(this.minIntervalMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  private affiliateConfigured(): boolean {
    return Boolean(
      process.env.WALMART_PUBLISHER_ID?.trim() &&
        process.env.WALMART_CONSUMER_ID?.trim()
    );
  }

  private async searchAffiliate(query: string, maxItems: number): Promise<WalmartItem[]> {
    const publisherId = process.env.WALMART_PUBLISHER_ID!.trim();
    const consumerId = process.env.WALMART_CONSUMER_ID!.trim();
    const url = `${AFFILIATE_SEARCH}?query=${encodeURIComponent(query)}&publisherId=${encodeURIComponent(publisherId)}&numItems=${Math.min(maxItems, 25)}`;

    await this.throttle();
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        "WM_SEC.ACCESS_TOKEN": process.env.WALMART_ACCESS_TOKEN ?? "",
        "WM_CONSUMER.ID": consumerId,
        "WM_QOS.CORRELATION_ID": crypto.randomUUID(),
        "user-agent": this.userAgent,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!res.ok) {
      throw new WalmartRequestError(`Walmart affiliate search ${res.status}`, res.status);
    }

    const json = (await res.json()) as { items?: Record<string, unknown>[] };
    const items: WalmartItem[] = [];
    for (const row of json.items ?? []) {
      const mapped = mapRawItem(row);
      if (mapped) items.push(mapped);
      if (items.length >= maxItems) break;
    }
    return items;
  }

  private async searchHtml(query: string, maxItems: number): Promise<WalmartItem[]> {
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

        const text = await res.text();
        if (res.status === 403 || /blocked|Just a moment/i.test(text.slice(0, 400))) {
          throw new WalmartAccessError(`Walmart search blocked (${res.status})`);
        }
        if (!res.ok) {
          throw new WalmartRequestError(`Walmart search ${res.status}`, res.status);
        }

        const page = parseWalmartSearchPayload(text);
        return page.items.slice(0, maxItems);
      } catch (err) {
        lastError = err;
        const retriable = err instanceof WalmartRequestError && err.status >= 500;
        if (!retriable || attempt === this.maxRetries) break;
        await sleep(this.minIntervalMs * (attempt + 1));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Walmart search failed: ${String(lastError)}`);
  }

  async searchRetail(
    query: string,
    opts: { maxItems?: number } = {}
  ): Promise<WalmartItem[]> {
    const maxItems = opts.maxItems ?? 25;
    if (this.affiliateConfigured()) {
      try {
        return await this.searchAffiliate(query, maxItems);
      } catch (err) {
        if (process.env.WALMART_AFFILIATE_STRICT === "1") throw err;
        console.warn(
          `[walmart_us] affiliate search failed (${(err as Error).message}); trying HTML`
        );
      }
    }
    return this.searchHtml(query, maxItems);
  }
}
