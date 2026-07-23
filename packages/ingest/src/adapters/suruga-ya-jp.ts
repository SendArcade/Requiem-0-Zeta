import { loadFixtureObservations } from "@beyoracle/catalog";
import type { ObservationDTO } from "@beyoracle/shared";
import { computeLandedJpySync } from "@beyoracle/shared";
import {
  inferConditionFromTitle,
  makeObservationId,
  type PricingSource,
  type RawListing,
  type SearchOpts,
} from "../types.js";
import {
  SurugaYaAccessError,
  SurugaYaClient,
  type SurugaYaItem,
} from "./suruga-ya/client.js";

/**
 * Suruga-ya JP adapter — live search with fixture fallback.
 * Live rows are retail ask prices (sold-out rows = likely sold reference).
 * Attribution: search surface from suruguya PyPI / datalab-jp scraper patterns.
 */
export class SurugaYaJpSource implements PricingSource {
  readonly id = "suruga_ya_jp" as const;

  private client: SurugaYaClient | null = null;

  private liveEnabled(): boolean {
    return process.env.SURUGAYA_API_ENABLED === "1";
  }

  private strict(): boolean {
    return process.env.SURUGAYA_STRICT === "1";
  }

  private getClient(): SurugaYaClient {
    this.client ??= new SurugaYaClient();
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
          `[suruga_ya_jp] live search returned 0 rows for "${query}"; falling back to fixtures`
        );
      } catch (err) {
        if (this.strict()) throw err;
        if (err instanceof SurugaYaAccessError) {
          console.warn(`[suruga_ya_jp] ${err.message}`);
        } else {
          console.warn(
            `[suruga_ya_jp] live search failed (${(err as Error).message}); falling back to fixtures`
          );
        }
      }
    }

    return this.searchFixtures(query, limit, opts);
  }

  private toRawListing(item: SurugaYaItem, query: string): RawListing {
    const soldOutComp = process.env.SURUGAYA_SOLDOUT_AS_SOLD === "1";
    const status =
      soldOutComp && !item.inStock ? ("sold" as const) : ("listing" as const);

    return {
      externalId: item.productId,
      title: item.title,
      price: item.priceJpy,
      currency: "JPY",
      status,
      condition: inferConditionFromTitle(item.title),
      url: item.url,
      observedAt: new Date().toISOString(),
      raw: {
        live: true,
        query,
        priceKind: status === "sold" ? "sold_out_proxy" : "ask",
        inStock: item.inStock,
        compEligible: status === "sold",
        venueWeightMultiplier: status === "sold" ? 0.4 : 0,
      },
    };
  }

  private searchFixtures(
    query: string,
    limit: number,
    opts: SearchOpts
  ): RawListing[] {
    const fixtures = loadFixtureObservations("suruga_ya_jp");

    let results: RawListing[] = fixtures.map((f) => ({
      externalId: f.externalId,
      title: f.title,
      price: f.price,
      currency: f.currency,
      status: f.status,
      condition: f.condition,
      url: f.url,
      observedAt: f.observedAt,
      raw: { fixture: true, query, priceKind: "fixture_sold", compEligible: true },
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
      condition: raw.condition ?? inferConditionFromTitle(raw.title),
      url: raw.url,
      observedAt,
      rawJson: raw.raw ?? {},
      landedJpy: landed.landedJpy,
      fxRateAtSale: landed.fxRateAtSale,
      shippingJpy: landed.shippingJpy,
    };
  }
}
