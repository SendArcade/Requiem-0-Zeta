import type { Condition, Currency, EvidenceKind, MatchMethod, SourceId } from "@beyoracle/shared";
import { getPartById } from "@beyoracle/catalog";
import type {
  computeOracleByCondition,
  computeOracleValue,
} from "@beyoracle/oracle";

export interface CompRow {
  id: string;
  source: SourceId;
  title: string;
  price: number;
  currency: Currency;
  displayPrice: number;
  displayCurrency: Currency;
  condition: string;
  observedAt: string;
  url: string;
  evidenceKind: EvidenceKind;
  /** Whether this row fed the published Oracle Value median. */
  inOracleMark: boolean;
  matchMethod?: MatchMethod;
  matchConfidence?: number;
}

export interface AssetData {
  part: NonNullable<ReturnType<typeof getPartById>>;
  oracle: ReturnType<typeof computeOracleValue>;
  oracleByCondition: Partial<
    Record<Condition, NonNullable<ReturnType<typeof computeOracleValue>>>
  >;
  comps: CompRow[];
  chart: Array<{ date: string; price: number }>;
  conditions: Condition[];
}

export type SearchResultItem =
  | {
      kind: "product";
      id: string;
      nameEn: string;
      nameJp: string | null;
      generation: string;
      productCodes: string[];
      skuType: string;
      oracleValue: number | null;
      nComps: number;
      confidence?: string;
    }
  | {
      kind: "part";
      id: string;
      nameEn: string;
      nameJp: string | null;
      generation: string;
      productCodes: string[];
      partType: string;
      oracleValue: number | null;
      nComps: number;
      confidence?: string;
    };
