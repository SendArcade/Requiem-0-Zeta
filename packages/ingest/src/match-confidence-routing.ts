/**
 * Three-zone match routing per docs/MATCHING_RESEARCH.md:
 * auto-accept ≥0.90, review 0.60–0.90, reject below 0.60.
 */
export const MATCH_AUTO_ACCEPT_THRESHOLD = 0.9;
export const MATCH_REVIEW_MIN_THRESHOLD = 0.6;

export type MatchRoutingZone = "auto_accept" | "review" | "reject";

export function routeMatchByConfidence(confidence: number): MatchRoutingZone {
  if (confidence >= MATCH_AUTO_ACCEPT_THRESHOLD) return "auto_accept";
  if (confidence >= MATCH_REVIEW_MIN_THRESHOLD) return "review";
  return "reject";
}

export function shouldPersistMatch(confidence: number): boolean {
  return routeMatchByConfidence(confidence) === "auto_accept";
}

export function shouldQueueForReview(confidence: number): boolean {
  return routeMatchByConfidence(confidence) === "review";
}
