// PricingSource interface — pattern from tcg_mcp Protocol
import type {
  Condition,
  Currency,
  ObservationDTO,
  ObservationStatus,
  SourceId,
} from "@beyoracle/shared";

export interface RawListing {
  externalId: string;
  title: string;
  price: number;
  currency: Currency;
  status: ObservationStatus;
  condition?: Condition;
  url: string;
  observedAt: string;
  raw?: Record<string, unknown>;
}

export interface SearchOpts {
  limit?: number;
  status?: ObservationStatus;
}

/** Provider interface for pricing corridors */
export interface PricingSource {
  readonly id: SourceId;
  search(query: string, opts?: SearchOpts): Promise<RawListing[]>;
  normalize(raw: RawListing): ObservationDTO;
}

export function inferConditionFromTitle(title: string): Condition {
  const t = title.toLowerCase();
  if (/新品|未開封|sealed|全新/.test(t)) return "sealed";
  if (/美品|近全新|like.?new|9\.?5成新/.test(t)) return "like_new";
  if (/中古|used|二手|傷/.test(t)) return "used";
  return "unknown";
}

export function makeObservationId(source: SourceId, externalId: string): string {
  return `${source}:${externalId}`;
}

export { looksLikeBundle } from "@beyoracle/shared";
