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
  WalmartAccessError,
  WalmartClient,
  type WalmartItem,
} from "./walmart/client.js";

/**
 * Walmart US retail ask — MSRP/shelf reference, not sold comps.
 * Env: WALMART_API_ENABLED=1
 */
export class WalmartUsSource implements PricingSource {
  readonly id = "walmart_us" as const;

  private client: WalmartClient | null = null;

  private liveEnabled(): boolean {
    return process.env.WALMART_API_ENABLED === "1";
  }

  private strict(): boolean {
    return process.env.WALMART_STRICT === "1";
  }

  private getClient(): WalmartClient {
    this.client ??= new WalmartClient({
      minIntervalMs: Number(process.env.WALMART_MIN_INTERVAL_MS ?? 1_500),
    });
    return this.client;
  }

  async search(query: string, opts: SearchOpts = {}): Promise<RawListing[]> {
    const limit = opts.limit ?? 25;

    if (this.liveEnabled() && query.trim()) {
      try {
        const items = await this.getClient().searchRetail(query, { maxItems: limit });
        let results = items.map((item) => this.toRawListing(item, query));
        if (opts.status) {
          results = results.filter((r) => r.status === opts.status);
        }
        if (results.length > 0) return results.slice(0, limit);
        console.warn(`[walmart_us] live search returned 0 rows for "${query}"; fixtures`);
      } catch (err) {
        if (this.strict()) throw err;
        if (err instanceof WalmartAccessError) {
          console.warn(`[walmart_us] ${err.message}`);
        } else {
          console.warn(
            `[walmart_us] live search failed (${(err as Error).message}); fixtures`
          );
        }
      }
    }

    return this.searchFixtures(query, limit, opts);
  }

  private toRawListing(item: WalmartItem, query: string): RawListing {
    return {
      externalId: item.itemId,
      title: item.title,
      price: item.price,
      currency: "USD",
      status: "listing",
      condition: resolveListingCondition(item.title, "sealed"),
      url: item.url,
      observedAt: new Date().toISOString(),
      raw: {
        live: true,
        query,
        priceKind: "ask",
        compEligible: false,
        venue: "walmart_us",
        priceType: item.priceType,
        tracker: "camelmart_compatible",
      },
    };
  }

  private searchFixtures(
    query: string,
    limit: number,
    opts: SearchOpts
  ): RawListing[] {
    const fixtures = loadFixtureObservations("walmart_us");

    let results: RawListing[] = fixtures.map((f) => ({
      externalId: f.externalId,
      title: f.title,
      price: f.price,
      currency: f.currency,
      status: f.status,
      condition: f.condition,
      url: f.url,
      observedAt: f.observedAt,
      raw: {
        fixture: true,
        query,
        priceKind: "ask",
        compEligible: false,
      },
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
