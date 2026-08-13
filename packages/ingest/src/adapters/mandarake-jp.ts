import { loadFixtureObservations } from "@beyoracle/catalog";
import type { ObservationDTO } from "@beyoracle/shared";
import { computeLandedJpySync } from "@beyoracle/shared";
import {
  resolveListingCondition,
  makeObservationId,
  type PricingSource,
  type RawListing,
  type SearchOpts,
} from "../types.js";
import {
  MandarakeAccessError,
  MandarakeClient,
  type MandarakeItem,
} from "./mandarake/client.js";

/**
 * Mandarake JP adapter — live order.mandarake.co.jp search with fixture fallback.
 * Attribution: search URL + HTML row shape from msikma/mdrscr.
 */
export class MandarakeJpSource implements PricingSource {
  readonly id = "mandarake_jp" as const;

  private client: MandarakeClient | null = null;

  private liveEnabled(): boolean {
    return process.env.MANDARAKE_API_ENABLED === "1";
  }

  private strict(): boolean {
    return process.env.MANDARAKE_STRICT === "1";
  }

  private getClient(): MandarakeClient {
    this.client ??= new MandarakeClient({
      minIntervalMs: Number(process.env.MANDARAKE_MIN_INTERVAL_MS ?? 1_500),
    });
    return this.client;
  }

  async search(query: string, opts: SearchOpts = {}): Promise<RawListing[]> {
    const limit = opts.limit ?? 50;

    if (this.liveEnabled() && query.trim()) {
      try {
        const items = await this.fetchLiveItems(query, limit);
        let results = items.map((item) => this.toRawListing(item, query));

        if (opts.status) {
          results = results.filter((r) => r.status === opts.status);
        }

        if (results.length > 0) {
          return results.slice(0, limit);
        }

        console.warn(
          `[mandarake_jp] live search returned 0 rows for "${query}"; falling back to fixtures`
        );
      } catch (err) {
        if (this.strict()) throw err;
        if (err instanceof MandarakeAccessError) {
          console.warn(`[mandarake_jp] ${err.message}`);
        } else {
          console.warn(
            `[mandarake_jp] live search failed (${(err as Error).message}); falling back to fixtures`
          );
        }
      }
    }

    return this.searchFixtures(query, limit, opts);
  }

  /** Sold comps first; optional ask rows when MANDARAKE_INCLUDE_ASK=1. */
  private async fetchLiveItems(
    query: string,
    limit: number
  ): Promise<MandarakeItem[]> {
    const client = this.getClient();
    const includeAsk = process.env.MANDARAKE_INCLUDE_ASK === "1";

    const sold = await client.searchItems(query, {
      limit,
      includeSoldOut: false,
    });

    if (!includeAsk) {
      return sold.slice(0, limit);
    }

    const askLimit = Math.max(limit - sold.length, 0);
    if (askLimit === 0) return sold;

    const ask = await client.searchItems(query, {
      limit: askLimit,
      includeSoldOut: true,
    });

    const seen = new Set(sold.map((i) => i.itemCode));
    const merged = [...sold];
    for (const item of ask) {
      if (seen.has(item.itemCode)) continue;
      merged.push(item);
      if (merged.length >= limit) break;
    }
    return merged;
  }

  private toRawListing(item: MandarakeItem, query: string): RawListing {
    return {
      externalId: item.itemCode,
      title: item.title,
      price: item.priceJpy,
      currency: "JPY",
      status: item.soldOut ? "sold" : "listing",
      condition: resolveListingCondition(item.title),
      url: item.url,
      observedAt: new Date().toISOString(),
      raw: {
        live: true,
        query,
        soldOut: item.soldOut,
        itemNo: item.itemNo,
        shop: item.shop,
        stockText: item.stockText,
      },
    };
  }

  private searchFixtures(
    query: string,
    limit: number,
    opts: SearchOpts
  ): RawListing[] {
    const fixtures = loadFixtureObservations("mandarake_jp");

    let results: RawListing[] = fixtures.map((f) => ({
      externalId: f.externalId,
      title: f.title,
      price: f.price,
      currency: f.currency,
      status: f.status,
      condition: f.condition,
      url: f.url,
      observedAt: f.observedAt,
      raw: { fixture: true, query },
    }));

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.externalId.toLowerCase().includes(q)
      );
    }

    if (opts.status) {
      results = results.filter((r) => r.status === opts.status);
    }

    return results.slice(0, limit);
  }

  normalize(raw: RawListing): ObservationDTO {
    const observedAt = new Date(raw.observedAt);
    const landed = computeLandedJpySync({
      source: this.id,
      price: raw.price,
      currency: raw.currency,
      observedAt,
      rawJson: raw.raw ?? {},
    });

    return {
      id: makeObservationId(this.id, raw.externalId),
      source: this.id,
      externalId: raw.externalId,
      title: raw.title,
      price: raw.price,
      currency: raw.currency,
      status: raw.status,
      condition: resolveListingCondition(raw.title, raw.condition),
      url: raw.url,
      observedAt,
      rawJson: raw.raw ?? {},
      landedJpy: landed.landedJpy,
      fxRateAtSale: landed.fxRateAtSale,
      shippingJpy: landed.shippingJpy,
    };
  }
}
