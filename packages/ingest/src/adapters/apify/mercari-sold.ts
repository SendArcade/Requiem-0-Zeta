/**
 * Mercari JP sold comps via Apify `kitebuilds/resale-sold-comps`.
 * Attribution: docs/ATTRIBUTIONS.md
 */
import type { Condition } from "@beyoracle/shared";
import type { RawListing } from "../../types.js";
import { inferConditionFromTitle } from "../../types.js";
import { mercariItemUrl } from "../mercari/client.js";
import { apifyConfigured, runActorSyncGetItems } from "./client.js";

/** Apify store actor id. */
export const MERCARI_SOLD_ACTOR = "kitebuilds/resale-sold-comps";

export interface ApifyMercariSoldRow {
  platform?: string;
  title?: string;
  soldPrice?: number;
  currency?: string;
  condition?: string;
  soldDate?: string;
  url?: string;
  query?: string;
  type?: string;
}

const ENGLISH_CONDITION: Record<string, Condition> = {
  new: "sealed",
  "like new": "like_new",
  good: "used",
  fair: "used",
  poor: "used",
  damaged: "used",
};

export function conditionFromApifyMercari(text: string | undefined): Condition {
  if (!text) return "unknown";
  const key = text.trim().toLowerCase();
  return ENGLISH_CONDITION[key] ?? "unknown";
}

export function mercariIdFromUrl(url: string): string | null {
  const match = url.match(/\/item\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

export function isApifyMercariSoldRow(row: ApifyMercariSoldRow): boolean {
  if (row.type === "SUMMARY" || row.type === "price_summary") return false;
  if (typeof row.soldPrice !== "number" || !row.title || !row.url) return false;
  return true;
}

export function mapApifyMercariRow(
  row: ApifyMercariSoldRow,
  query: string
): RawListing | null {
  if (!isApifyMercariSoldRow(row)) return null;

  const externalId = mercariIdFromUrl(row.url!);
  if (!externalId) return null;

  const fromApify = conditionFromApifyMercari(row.condition);
  const condition =
    fromApify !== "unknown"
      ? fromApify
      : inferConditionFromTitle(row.title!);

  const observedAt = row.soldDate
    ? new Date(`${row.soldDate}T12:00:00.000Z`).toISOString()
    : new Date().toISOString();

  return {
    externalId,
    title: row.title!,
    price: row.soldPrice!,
    currency: "JPY",
    status: "sold",
    condition,
    url: row.url ?? mercariItemUrl(externalId),
    observedAt,
    raw: {
      live: true,
      provider: "apify",
      actor: MERCARI_SOLD_ACTOR,
      query,
      apify: row as unknown as Record<string, unknown>,
    },
  };
}

export async function searchMercariSoldViaApify(
  query: string,
  limit: number
): Promise<RawListing[]> {
  if (!apifyConfigured()) {
    throw new Error("Apify Mercari path requires APIFY_TOKEN");
  }

  const rows = await runActorSyncGetItems<ApifyMercariSoldRow>(MERCARI_SOLD_ACTOR, {
    searchTerm: query,
    platform: "mercari",
    mercariMarket: "jp",
    maxItems: limit,
  });

  const listings: RawListing[] = [];
  for (const row of rows) {
    const mapped = mapApifyMercariRow(row, query);
    if (mapped) listings.push(mapped);
    if (listings.length >= limit) break;
  }

  return listings;
}
