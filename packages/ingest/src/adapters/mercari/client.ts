import crypto from "node:crypto";
import type { Condition } from "@beyoracle/shared";
import { createDpopProof, generateDpopKeyPair, type DpopKeyPair } from "./dpop.js";

const SEARCH_URL = "https://api.mercari.jp/v2/entities:search";

/** Mercari caps a search page at 120 items. */
const MAX_PAGE_SIZE = 120;

export interface MercariItem {
  id: string;
  name: string;
  price: number;
  status: string;
  itemConditionId?: number;
  created?: number;
  updated?: number;
  thumbnails?: string[];
  sellerId?: string;
}

export interface MercariSearchPage {
  items: MercariItem[];
  nextPageToken: string | null;
}

export interface MercariClientOptions {
  /** Minimum gap between requests, in ms. Mercari throttles per-IP. */
  minIntervalMs?: number;
  maxRetries?: number;
  timeoutMs?: number;
  userAgent?: string;
}

/**
 * Mercari's `itemConditionId` scale, collapsed onto our four-way axis.
 * 1 新品、未使用 / 2 未使用に近い / 3 目立った傷や汚れなし
 * 4 やや傷や汚れあり / 5 傷や汚れあり / 6 全体的に状態が悪い
 */
const CONDITION_BY_ID: Record<number, Condition> = {
  1: "sealed",
  2: "like_new",
  3: "used",
  4: "used",
  5: "used",
  6: "used",
};

export function conditionFromMercariId(id: number | undefined): Condition {
  if (id === undefined) return "unknown";
  return CONDITION_BY_ID[id] ?? "unknown";
}

export function mercariItemUrl(id: string): string {
  return `https://jp.mercari.com/item/${id}`;
}

export class MercariRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "MercariRequestError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class MercariClient {
  private readonly keys: DpopKeyPair;
  private readonly minIntervalMs: number;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private lastRequestAt = 0;

  constructor(opts: MercariClientOptions = {}) {
    this.keys = generateDpopKeyPair();
    this.minIntervalMs = opts.minIntervalMs ?? 1_200;
    this.maxRetries = opts.maxRetries ?? 3;
    this.timeoutMs = opts.timeoutMs ?? 15_000;
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

  private buildBody(
    keyword: string,
    soldOnly: boolean,
    pageSize: number,
    pageToken: string
  ): Record<string, unknown> {
    return {
      userId: "",
      pageSize: Math.min(pageSize, MAX_PAGE_SIZE),
      pageToken,
      searchSessionId: crypto.randomUUID(),
      indexRouting: "INDEX_ROUTING_UNSPECIFIED",
      thumbnailTypes: [],
      searchCondition: {
        keyword,
        excludeKeyword: "",
        sort: "SORT_CREATED_TIME",
        order: "ORDER_DESC",
        status: soldOnly ? ["STATUS_SOLD_OUT"] : [],
        sizeId: [],
        categoryId: [],
        brandId: [],
        sellerId: [],
        priceMin: 0,
        priceMax: 0,
        itemConditionId: [],
        shippingPayerId: [],
        shippingFromArea: [],
        shippingMethod: [],
        colorId: [],
        hasCoupon: false,
        attributes: [],
        itemTypes: [],
        skuIds: [],
        shopIds: [],
      },
      defaultDatasets: [],
      serviceFrom: "suruga",
      withItemBrand: true,
      withItemSize: false,
      withItemPromotions: false,
      withItemSizes: false,
      withShopname: false,
      useDynamicAttribute: true,
      withSuggestedItems: false,
      withOfferPricePromotion: false,
      withProductSuggest: false,
      withParentProducts: false,
      withProductArticles: false,
      withSearchConditionId: false,
    };
  }

  async searchPage(
    keyword: string,
    opts: { soldOnly?: boolean; pageSize?: number; pageToken?: string } = {}
  ): Promise<MercariSearchPage> {
    const { soldOnly = true, pageSize = MAX_PAGE_SIZE, pageToken = "" } = opts;

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      await this.throttle();

      try {
        const res = await fetch(SEARCH_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "*/*",
            dpop: createDpopProof(this.keys, SEARCH_URL, "POST"),
            "x-platform": "web",
            "user-agent": this.userAgent,
          },
          body: JSON.stringify(
            this.buildBody(keyword, soldOnly, pageSize, pageToken)
          ),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        // Throttling and upstream faults are worth another try; a 4xx is not.
        if (res.status === 429 || res.status >= 500) {
          throw new MercariRequestError(
            `Mercari search failed with ${res.status}`,
            res.status
          );
        }

        if (!res.ok) {
          const body = await res.text();
          throw new MercariRequestError(
            `Mercari search rejected with ${res.status}: ${body.slice(0, 200)}`,
            res.status
          );
        }

        const json = (await res.json()) as {
          items?: MercariItem[];
          meta?: { nextPageToken?: string };
          nextPageToken?: string;
        };

        const next = json.meta?.nextPageToken ?? json.nextPageToken ?? "";

        return {
          items: json.items ?? [],
          nextPageToken: next && next.length > 0 ? next : null,
        };
      } catch (err) {
        lastError = err;

        const retriable =
          err instanceof MercariRequestError
            ? err.status === 429 || err.status >= 500
            : true;

        if (!retriable || attempt === this.maxRetries) break;

        await sleep(this.minIntervalMs * Math.pow(2, attempt));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Mercari search failed: ${String(lastError)}`);
  }

  /** Walk pages until `maxItems` is reached or Mercari stops paginating. */
  async searchSold(
    keyword: string,
    opts: { maxItems?: number; maxPages?: number } = {}
  ): Promise<MercariItem[]> {
    const { maxItems = 120, maxPages = 5 } = opts;

    const collected: MercariItem[] = [];
    const seen = new Set<string>();
    let pageToken = "";

    for (let page = 0; page < maxPages && collected.length < maxItems; page++) {
      const { items, nextPageToken } = await this.searchPage(keyword, {
        soldOnly: true,
        pageSize: Math.min(MAX_PAGE_SIZE, maxItems - collected.length),
        pageToken,
      });

      if (items.length === 0) break;

      for (const item of items) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        collected.push(item);
        if (collected.length >= maxItems) break;
      }

      if (!nextPageToken) break;
      pageToken = nextPageToken;
    }

    return collected;
  }
}
