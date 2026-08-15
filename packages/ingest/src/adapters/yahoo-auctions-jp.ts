import { loadFixtureObservations } from "@beyoracle/catalog";
import type { ObservationDTO } from "@beyoracle/shared";
import {
  resolveListingCondition,
  makeObservationId,
  type PricingSource,
  type RawListing,
  type SearchOpts,
} from "../types.js";
import { parseLiveProviderChain } from "./apify/client.js";
import { searchYahooSoldViaApify } from "./apify/yahoo-sold.js";
import {
  conditionFromYahoo,
  YahooAuctionsClient,
  yahooItemUrl,
  type YahooItem,
} from "./yahoo-auctions/client.js";

/**
 * Yahoo Auctions JP closed search (落札相場) — realized sale prices.
 * One adapter covers two marketplaces: Yahoo Auctions and Yahoo!フリマ.
 */
let yahooLiveFailureStreak = 0;
let yahooLiveCircuitOpen = false;

export class YahooAuctionsJpSource implements PricingSource {
  readonly id = "yahoo_auctions_jp" as const;

  private client: YahooAuctionsClient | null = null;

  private liveEnabled(): boolean {
    return process.env.YAHOO_AUCTIONS_ENABLED === "1";
  }

  private strict(): boolean {
    return process.env.YAHOO_AUCTIONS_STRICT === "1";
  }

  private liveProviders(): string[] {
    return parseLiveProviderChain(process.env.YAHOO_LIVE_PROVIDER, {
      primary: "self",
      fallback: "apify",
    });
  }

  private getClient(): YahooAuctionsClient {
    this.client ??= new YahooAuctionsClient({
      minIntervalMs: Number(process.env.YAHOO_MIN_INTERVAL_MS ?? 1_500),
    });
    return this.client;
  }

  async search(query: string, opts: SearchOpts = {}): Promise<RawListing[]> {
    const limit = opts.limit ?? 50;

    if (this.liveEnabled() && query.trim() && !yahooLiveCircuitOpen) {
      try {
        const listings = await this.searchLive(query, limit);
        yahooLiveFailureStreak = 0;
        return listings;
      } catch (err) {
        if (this.strict()) throw err;
        yahooLiveFailureStreak++;
        const threshold = Number(process.env.YAHOO_CIRCUIT_FAILURES ?? 5);
        if (yahooLiveFailureStreak >= threshold) {
          yahooLiveCircuitOpen = true;
          console.warn(
            `[yahoo_auctions_jp] opening live circuit after ${yahooLiveFailureStreak} failures — fixtures only for this process`
          );
        } else {
          console.warn(
            `[yahoo_auctions_jp] live search failed (${(err as Error).message}); falling back to fixtures`
          );
        }
      }
    } else if (yahooLiveCircuitOpen && this.liveEnabled() && query.trim()) {
      // fixtures only — avoid per-query timeout noise from blocked datacenter IPs
    }

    return this.searchFixtures(query, limit, opts);
  }

  private async searchLive(query: string, limit: number): Promise<RawListing[]> {
    const providers = this.liveProviders();
    let lastError: unknown;

    for (const provider of providers) {
      try {
        if (provider === "self") {
          return await this.searchSelf(query, limit);
        }
        if (provider === "apify") {
          return await searchYahooSoldViaApify(query, limit);
        }
        console.warn(`[yahoo_auctions_jp] unknown live provider "${provider}" — skipping`);
      } catch (err) {
        lastError = err;
        if (providers.length > 1) {
          console.warn(
            `[yahoo_auctions_jp] ${provider} live path failed (${(err as Error).message}); trying next provider`
          );
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Yahoo live search failed with no providers");
  }

  private async searchSelf(query: string, limit: number): Promise<RawListing[]> {
    const items = await this.getClient().searchSold(query, {
      maxItems: limit,
      maxPages: Number(process.env.YAHOO_MAX_PAGES ?? 5),
    });
    return items.map((item) => this.toRawListing(item, query, "self"));
  }

  private toRawListing(
    item: YahooItem,
    query: string,
    provider: "self" | "apify" = "self"
  ): RawListing {
    return {
      externalId: item.auctionId,
      title: item.title,
      price: item.price,
      currency: "JPY",
      // Closed search only returns completed sales.
      status: "sold",
      condition: conditionFromYahoo(item.itemCondition),
      url: yahooItemUrl(item),
      observedAt: new Date(item.endTime).toISOString(),
      raw: {
        live: true,
        provider,
        query,
        venue: item.isFleamarketItem ? "yahoo_fleamarket" : "yahoo_auction",
        bidCount: item.bidCount,
        item: item as unknown as Record<string, unknown>,
      },
    };
  }

  private searchFixtures(
    query: string,
    limit: number,
    opts: SearchOpts
  ): RawListing[] {
    const fixtures = loadFixtureObservations("yahoo_auctions_jp");

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

/** Test hook — reset module-level circuit breaker between cases. */
export function resetYahooLiveCircuitForTests(): void {
  yahooLiveFailureStreak = 0;
  yahooLiveCircuitOpen = false;
}
