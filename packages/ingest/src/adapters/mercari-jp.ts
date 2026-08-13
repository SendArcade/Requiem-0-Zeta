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
  conditionFromMercariId,
  MercariClient,
  mercariItemUrl,
  type MercariItem,
} from "./mercari/client.js";

/** Mercari JP adapter — fixture-first; live sold-comps path env-gated. */
export class MercariJpSource implements PricingSource {
  readonly id = "mercari_jp" as const;

  private client: MercariClient | null = null;

  private liveEnabled(): boolean {
    return process.env.MERCARI_API_ENABLED === "1";
  }

  /** When set, a live failure throws instead of silently using fixtures. */
  private strict(): boolean {
    return process.env.MERCARI_STRICT === "1";
  }

  private getClient(): MercariClient {
    this.client ??= new MercariClient({
      minIntervalMs: Number(process.env.MERCARI_MIN_INTERVAL_MS ?? 1_200),
    });
    return this.client;
  }

  async search(query: string, opts: SearchOpts = {}): Promise<RawListing[]> {
    const limit = opts.limit ?? 50;

    if (this.liveEnabled() && query.trim()) {
      try {
        return await this.searchLive(query, limit);
      } catch (err) {
        if (this.strict()) throw err;
        console.warn(
          `[mercari_jp] live search failed (${(err as Error).message}); falling back to fixtures`
        );
      }
    }

    return this.searchFixtures(query, limit, opts);
  }

  private async searchLive(query: string, limit: number): Promise<RawListing[]> {
    const items = await this.getClient().searchSold(query, {
      maxItems: limit,
      maxPages: Number(process.env.MERCARI_MAX_PAGES ?? 5),
    });

    return items.map((item) => this.toRawListing(item, query));
  }

  private toRawListing(item: MercariItem, query: string): RawListing {
    // Sold items carry no explicit sale timestamp; `updated` is the closest proxy.
    const soldAtSeconds = item.updated ?? item.created;

    return {
      externalId: item.id,
      title: item.name,
      // Mercari JSON may return price as string — always coerce to number.
      price: Number(item.price),
      currency: "JPY",
      status: item.status === "ITEM_STATUS_SOLD_OUT" ? "sold" : "listing",
      condition: conditionFromMercariId(item.itemConditionId),
      url: mercariItemUrl(item.id),
      observedAt: new Date((soldAtSeconds ?? Date.now() / 1000) * 1000).toISOString(),
      raw: { live: true, query, item: item as unknown as Record<string, unknown> },
    };
  }

  private searchFixtures(
    query: string,
    limit: number,
    opts: SearchOpts
  ): RawListing[] {
    const fixtures = loadFixtureObservations("mercari_jp");

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
      price: Number(raw.price),
      currency: raw.currency,
      status: raw.status,
      condition: resolveListingCondition(raw.title, raw.condition),
      url: raw.url,
      observedAt: new Date(raw.observedAt),
      rawJson: raw.raw ?? {},
    };
  }
}
