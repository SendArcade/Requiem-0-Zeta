import { loadFixtureObservations } from "@beyoracle/catalog";
import type { ObservationDTO } from "@beyoracle/shared";
import {
  resolveListingCondition,
  makeObservationId,
  type PricingSource,
  type RawListing,
  type SearchOpts,
} from "../types.js";
import {
  EbayClient,
  type EbayItem,
} from "./ebay/client.js";

/**
 * eBay US sold listings — free self-scrape (LH_Sold + LH_Complete).
 * Env: EBAY_SOLD_ENABLED=1
 */
export class EbayComSource implements PricingSource {
  readonly id = "ebay_com" as const;

  private client: EbayClient | null = null;

  private liveEnabled(): boolean {
    return process.env.EBAY_SOLD_ENABLED === "1";
  }

  private strict(): boolean {
    return process.env.EBAY_STRICT === "1";
  }

  private getClient(): EbayClient {
    this.client ??= new EbayClient();
    return this.client;
  }

  async search(query: string, opts: SearchOpts = {}): Promise<RawListing[]> {
    const limit = opts.limit ?? 50;

    if (this.liveEnabled() && query.trim()) {
      try {
        const items = await this.getClient().searchSold(query, {
          maxItems: limit,
          maxPages: Number(process.env.EBAY_MAX_PAGES ?? 3),
        });
        if (items.length === 0 && !this.strict()) {
          console.warn(
            `[ebay_com] live search returned 0 rows for "${query}"; falling back to fixtures`
          );
          return this.searchFixtures(query, limit, opts, true);
        } else {
          let rows = items.map((item) => this.toRawListing(item, query));
          if (opts.status) {
            rows = rows.filter((r) => r.status === opts.status);
          }
          return rows.slice(0, limit);
        }
      } catch (err) {
        if (this.strict()) throw err;
        console.warn(
          `[ebay_com] live search failed (${(err as Error).message}); falling back to fixtures`
        );
        return this.searchFixtures(query, limit, opts, true);
      }
    }

    return this.searchFixtures(query, limit, opts);
  }

  private toRawListing(item: EbayItem, query: string): RawListing {
    return {
      externalId: item.itemId,
      title: item.title,
      price: item.price,
      currency: "USD",
      status: "sold",
      url: item.url,
      observedAt: item.soldAt ?? new Date().toISOString(),
      raw: {
        live: true,
        query,
        listingType: item.listingType,
        venue: "ebay_us",
      },
    };
  }

  private searchFixtures(
    query: string,
    limit: number,
    opts: SearchOpts,
    /** When live scrape fails, return all fixtures — JP queries won't match English titles. */
    broad = false
  ): RawListing[] {
    const fixtures = loadFixtureObservations("ebay_com");

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

    if (query.trim() && !broad) {
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
      observedAt: new Date(raw.observedAt),
      rawJson: raw.raw ?? {},
    };
  }
}
