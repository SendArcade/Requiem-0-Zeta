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
  RutenAccessError,
  RutenClient,
  type RutenItem,
} from "./ruten/client.js";
import { classifyRutenListing } from "./ruten-quality.js";

/**
 * Ruten TW adapter — live rtapi search + prod batch with fixture fallback.
 * Attribution: rtapi pattern from Apify ruten-scraper / Ruten desktop-search bundle.
 */
export class RutenTwSource implements PricingSource {
  readonly id = "ruten_tw" as const;

  private client: RutenClient | null = null;

  private liveEnabled(): boolean {
    return process.env.RUTEN_API_ENABLED === "1";
  }

  private strict(): boolean {
    return process.env.RUTEN_STRICT === "1";
  }

  private getClient(): RutenClient {
    this.client ??= new RutenClient({
      minIntervalMs: Number(process.env.RUTEN_MIN_INTERVAL_MS ?? 1_500),
    });
    return this.client;
  }

  async search(query: string, opts: SearchOpts = {}): Promise<RawListing[]> {
    const limit = opts.limit ?? 50;

    if (this.liveEnabled() && query.trim()) {
      try {
        const items = await this.getClient().searchItems(query, { limit });
        let results = items.map((item) => this.toRawListing(item, query));

        if (opts.status) {
          results = results.filter((r) => r.status === opts.status);
        }

        if (results.length > 0) {
          return results.slice(0, limit);
        }

        console.warn(
          `[ruten_tw] live search returned 0 rows for "${query}"; falling back to fixtures`
        );
      } catch (err) {
        if (this.strict()) throw err;
        if (err instanceof RutenAccessError) {
          console.warn(`[ruten_tw] ${err.message}`);
        } else {
          console.warn(
            `[ruten_tw] live search failed (${(err as Error).message}); falling back to fixtures`
          );
        }
      }
    }

    return this.searchFixtures(query, limit, opts);
  }

  private toRawListing(
    item: RutenItem,
    query: string,
    opts: { fixture?: boolean } = {}
  ): RawListing {
    const quality = classifyRutenListing(item, opts);

    return {
      externalId: item.gNo,
      title: item.title,
      price: item.priceTwd,
      currency: "TWD",
      status: quality.status,
      condition: resolveListingCondition(item.title),
      url: item.url,
      observedAt: item.postTime ?? new Date().toISOString(),
      raw: {
        live: !opts.fixture,
        fixture: opts.fixture ?? false,
        query,
        soldCount: item.soldCount,
        stockQty: item.stockQty,
        priceRangeMax: item.priceRangeMax,
        sellerId: item.sellerId,
        cateId: item.cateId,
        shippingCostTwd: item.shippingCost,
        priceKind: quality.priceKind,
        compEligible: quality.compEligible,
        venueWeightMultiplier: quality.venueWeightMultiplier,
      },
    };
  }

  private searchFixtures(
    query: string,
    limit: number,
    opts: SearchOpts
  ): RawListing[] {
    const fixtures = loadFixtureObservations("ruten_tw");

    let results: RawListing[] = fixtures.map((f) =>
      this.toRawListing(
        {
          gNo: f.externalId,
          title: f.title,
          priceTwd: f.price,
          soldCount: 0,
          url: f.url,
          postTime: f.observedAt,
        },
        query,
        { fixture: true }
      )
    );

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
