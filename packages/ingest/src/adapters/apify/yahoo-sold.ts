/**
 * Yahoo Auctions JP sold comps via Apify `jpmarketdata/yahoo-auction-sold-comps`.
 * Attribution: docs/ATTRIBUTIONS.md
 */
import type { Condition } from "@beyoracle/shared";
import type { RawListing } from "../../types.js";
import { conditionFromYahoo } from "../yahoo-auctions/client.js";
import { apifyConfigured, runActorSyncGetItems } from "./client.js";

/** Apify store actor id. */
export const YAHOO_SOLD_ACTOR = "jpmarketdata/yahoo-auction-sold-comps";

export interface ApifyYahooSoldRow {
  type?: string;
  keyword?: string;
  title?: string;
  auctionId?: string;
  auctionURL?: string;
  url?: string;
  finalPriceJpy?: number;
  priceJpy?: number;
  soldPriceJpy?: number;
  price?: number;
  bidCount?: number;
  bids?: number;
  endTime?: string;
  endDate?: string;
  soldAt?: string;
  itemCondition?: string;
  condition?: string;
  isFleamarketItem?: boolean;
}

export function yahooAuctionIdFromUrl(url: string): string | null {
  const auction = url.match(/\/auction\/([^/?#]+)/i);
  if (auction?.[1]) return auction[1];
  const flea = url.match(/paypayfleamarket\.yahoo\.co\.jp\/item\/([^/?#]+)/i);
  return flea?.[1] ?? null;
}

export function isApifyYahooSoldRow(row: ApifyYahooSoldRow): boolean {
  if (row.type === "price_summary") return false;
  if (!row.title) return false;
  const price = readApifyYahooPrice(row);
  return typeof price === "number" && price > 0;
}

function readApifyYahooPrice(row: ApifyYahooSoldRow): number | undefined {
  for (const candidate of [
    row.finalPriceJpy,
    row.priceJpy,
    row.soldPriceJpy,
    row.price,
  ]) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function readApifyYahooBids(row: ApifyYahooSoldRow): number {
  const n = row.bidCount ?? row.bids;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function readApifyYahooEndTime(row: ApifyYahooSoldRow): string {
  for (const candidate of [row.endTime, row.endDate, row.soldAt]) {
    if (candidate) {
      const d = new Date(candidate);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  return new Date().toISOString();
}

function readApifyYahooCondition(row: ApifyYahooSoldRow): Condition {
  const code = row.itemCondition ?? row.condition;
  if (code && /^(NEW|USED\d+)$/i.test(code)) {
    return conditionFromYahoo(code.toUpperCase());
  }
  if (code) {
    const lower = code.toLowerCase();
    if (/new|新品|未使用/.test(lower)) return "sealed";
    if (/like.?new|未使用に近い/.test(lower)) return "like_new";
    if (/used|中古/.test(lower)) return "used";
  }
  return "unknown";
}

function readApifyYahooUrl(row: ApifyYahooSoldRow): string | null {
  return row.auctionURL ?? row.url ?? null;
}

export function mapApifyYahooRow(
  row: ApifyYahooSoldRow,
  query: string
): RawListing | null {
  if (!isApifyYahooSoldRow(row)) return null;

  const url = readApifyYahooUrl(row);
  const externalId =
    row.auctionId?.trim() ||
    (url ? yahooAuctionIdFromUrl(url) : null) ||
    null;
  if (!externalId) return null;

  const bidCount = readApifyYahooBids(row);
  const isFleamarket =
    row.isFleamarketItem === true ||
    (url?.includes("paypayfleamarket.yahoo.co.jp") ?? false);

  // Closed auctions with zero bids did not sell — same rule as self-scrape client.
  if (!isFleamarket && bidCount < 1) return null;

  const resolvedUrl =
    url ??
    (isFleamarket
      ? `https://paypayfleamarket.yahoo.co.jp/item/${externalId}`
      : `https://auctions.yahoo.co.jp/jp/auction/${externalId}`);

  return {
    externalId,
    title: row.title!,
    price: readApifyYahooPrice(row)!,
    currency: "JPY",
    status: "sold",
    condition: readApifyYahooCondition(row),
    url: resolvedUrl,
    observedAt: readApifyYahooEndTime(row),
    raw: {
      live: true,
      provider: "apify",
      actor: YAHOO_SOLD_ACTOR,
      query,
      venue: isFleamarket ? "yahoo_fleamarket" : "yahoo_auction",
      bidCount,
      apify: row as unknown as Record<string, unknown>,
    },
  };
}

export async function searchYahooSoldViaApify(
  query: string,
  limit: number
): Promise<RawListing[]> {
  if (!apifyConfigured()) {
    throw new Error("Apify Yahoo path requires APIFY_TOKEN");
  }

  const rows = await runActorSyncGetItems<ApifyYahooSoldRow>(YAHOO_SOLD_ACTOR, {
    keywords: [query],
    maxItemsPerKeyword: limit,
    soldOnly: true,
    includeIndividualItems: true,
    convertToUsd: false,
  });

  const listings: RawListing[] = [];
  for (const row of rows) {
    const mapped = mapApifyYahooRow(row, query);
    if (mapped) listings.push(mapped);
    if (listings.length >= limit) break;
  }

  return listings;
}
