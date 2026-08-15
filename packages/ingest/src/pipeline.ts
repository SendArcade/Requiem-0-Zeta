import { loadMatcherContext } from "@beyoracle/catalog";
import { matchObservation } from "@beyoracle/oracle";
import type { ObservationDTO } from "@beyoracle/shared";
import { isIngestEligible } from "@beyoracle/shared";
import { EbayComSource } from "./adapters/ebay-com.js";
import { AmazonUsSource } from "./adapters/amazon-us.js";
import { WalmartUsSource } from "./adapters/walmart-us.js";
import { MandarakeJpSource } from "./adapters/mandarake-jp.js";
import { MercariJpSource } from "./adapters/mercari-jp.js";
import { RutenTwSource } from "./adapters/ruten-tw.js";
import { ShopeeTwSource } from "./adapters/shopee-tw.js";
import { SurugaYaJpSource } from "./adapters/suruga-ya-jp.js";
import { YahooAuctionsJpSource } from "./adapters/yahoo-auctions-jp.js";
import type { PricingSource } from "./types.js";

export function getSources(): PricingSource[] {
  return [
    new MercariJpSource(),
    new ShopeeTwSource(),
    new YahooAuctionsJpSource(),
    new RutenTwSource(),
    new MandarakeJpSource(),
    new SurugaYaJpSource(),
    new EbayComSource(),
    new WalmartUsSource(),
    new AmazonUsSource(),
  ];
}

/** Part comps (single_part) or whole-SKU listings (complete_bey) — never lots. */
function isPipelineEligible(title: string): boolean {
  return isIngestEligible(title);
}

export async function ingestFromSource(
  source: PricingSource,
  query: string
): Promise<Array<{ observation: ObservationDTO; partId: string | null; confidence: number }>> {
  const raw = await source.search(query, { status: "sold" });
  const ctx = loadMatcherContext();

  return raw
    .filter((r) => isPipelineEligible(r.title))
    .map((r) => {
      const observation = source.normalize(r);
      const match = matchObservation(observation.title, ctx);
      return {
        observation,
        partId: match?.partId ?? null,
        confidence: match?.confidence ?? 0,
      };
    });
}

export async function ingestFixturesSmoke(): Promise<{
  mercari: number;
  shopee: number;
  matched: number;
}> {
  const sources = getSources();
  let mercari = 0;
  let shopee = 0;
  let matched = 0;

  for (const source of sources) {
    // Empty query returns all fixtures for smoke testing
    const results = await ingestFromSource(source, "");
    if (source.id === "mercari_jp") mercari = results.length;
    if (source.id === "shopee_tw") shopee = results.length;
    matched += results.filter((r) => r.partId !== null).length;
  }

  return { mercari, shopee, matched };
}
