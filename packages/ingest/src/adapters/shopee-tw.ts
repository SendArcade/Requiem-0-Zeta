import { loadFixtureObservations } from "@beyoracle/catalog";
import type { ObservationDTO } from "@beyoracle/shared";
import {
  resolveListingCondition,
  makeObservationId,
  type PricingSource,
  type RawListing,
  type SearchOpts,
} from "../types.js";
import { ShopeeAccessError, ShopeeClient } from "./shopee/client.js";

/**
 * Shopee TW adapter — fixture-first.
 * Live path attempts the public API and fails clearly: Shopee blocks unsigned
 * requests. Wire a commercial parser behind this interface when ready.
 */
export class ShopeeTwSource implements PricingSource {
  readonly id = "shopee_tw" as const;

  private client: ShopeeClient | null = null;

  private liveEnabled(): boolean {
    return process.env.SHOPEE_API_ENABLED === "1";
  }

  private strict(): boolean {
    return process.env.SHOPEE_STRICT === "1";
  }

  private getClient(): ShopeeClient {
    this.client ??= new ShopeeClient();
    return this.client;
  }

  async search(query: string, opts: SearchOpts = {}): Promise<RawListing[]> {
    const limit = opts.limit ?? 50;

    if (this.liveEnabled() && query.trim()) {
      try {
        await this.getClient().searchItems(query, { limit });
        // Unreachable today — ShopeeClient always throws until a parser is wired.
        return [];
      } catch (err) {
        if (this.strict()) throw err;
        if (err instanceof ShopeeAccessError) {
          console.warn(`[shopee_tw] ${err.message}`);
        } else {
          console.warn(
            `[shopee_tw] live search failed (${(err as Error).message}); falling back to fixtures`
          );
        }
      }
    }

    return this.searchFixtures(query, limit, opts);
  }

  private searchFixtures(
    query: string,
    limit: number,
    opts: SearchOpts
  ): RawListing[] {
    const fixtures = loadFixtureObservations("shopee_tw");

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
