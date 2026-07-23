import { loadMatcherContext, loadProductMatcherContext } from "@beyoracle/catalog";
import {
  matchObservation,
  matchToProduct,
  type MatchCandidate,
  type ProductMatchCandidate,
} from "@beyoracle/oracle";
import type { ListingShape } from "@beyoracle/shared";
import { classifyListingShape } from "@beyoracle/shared";

export type IngestMatch =
  | { kind: "product"; match: ProductMatchCandidate }
  | { kind: "part"; match: MatchCandidate };

/** Product match first for whole-SKU listings; part match for loose singles. */
export function resolveIngestMatch(
  title: string,
  opts?: { shape?: ListingShape }
): IngestMatch | null {
  const shape = opts?.shape ?? classifyListingShape(title);

  if (shape === "complete_bey") {
    const productMatch = matchToProduct(title, loadProductMatcherContext());
    return productMatch ? { kind: "product", match: productMatch } : null;
  }

  const partMatch = matchObservation(title, loadMatcherContext());
  if (partMatch) return { kind: "part", match: partMatch };

  return null;
}
