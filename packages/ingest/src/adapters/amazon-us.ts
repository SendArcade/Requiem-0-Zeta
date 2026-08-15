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
  AmazonAccessError,
  AmazonClient,
  type AmazonItem,
} from "./amazon/client.js";

/**
 * Amazon US retail ask — camelcamelcamel lane; MSRP reference, not sold comps.
 * Env: AMAZON_API_ENABLED=1
 */
export class AmazonUsSource implements PricingSource {
  readonly id = "amazon_us" as const;

  private client: AmazonClient | null = null;

  private liveEnabled(): boolean {
    return process.env.AMAZON_API_ENABLED === "1";
  }

  private strict(): boolean {
    return process.env.AMAZON_STRICT === "1";
  }

  private getClient(): AmazonClient {
    this.client ??= new AmazonClient({
      minIntervalMs: Number(process.env.AMAZON_MIN_INTERVAL_MS ?? 2_000),
    });
    return this.client;
  }

  async search(query: string, opts: SearchOpts = {}): Promise<RawListing[]> {
    const limit = opts.limit ?? 20;

    if (this.liveEnabled() && query.trim()) {
      try {
        const items = await this.getClient().searchRetail(query, { maxItems: limit });
        let results = items.map((item) => this.toRawListing(item, query));
        if (opts.status) {
          results = results.filter((r) => r.status === opts.status);
        }
        if (results.length > 0) return results.slice(0, limit);
        console.warn(`[amazon_us] live search returned 0 rows for "${query}"; fixtures`);
      } catch (err) {
        if (this.strict()) throw err;
        if (err instanceof AmazonAccessError) {
          console.warn(`[amazon_us] ${err.message}`);
        } else {
          console.warn(
            `[amazon_us] live search failed (${(err as Error).message}); fixtures`
          );
        }
      }
    }

    return this.searchFixtures(query, limit, opts);
  }

  private toRawListing(item: AmazonItem, query: string): RawListing {
    return {
      externalId: item.asin,
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
        venue: "amazon_us",
        tracker: "camelcamelcamel_compatible",
      },
    };
  }

  private searchFixtures(
    query: string,
    limit: number,
    opts: SearchOpts
  ): RawListing[] {
    const fixtures = loadFixtureObservations("amazon_us");

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
