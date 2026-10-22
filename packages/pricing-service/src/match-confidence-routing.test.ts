import { describe, it, expect } from "vitest";
import {
  MATCH_AUTO_ACCEPT_THRESHOLD,
  MATCH_REVIEW_MIN_THRESHOLD,
  routeMatchByConfidence,
  shouldPersistMatch,
  shouldQueueForReview,
} from "./match-confidence-routing.js";

describe("match confidence routing", () => {
  it("auto-accepts at and above 0.90", () => {
    expect(routeMatchByConfidence(0.9)).toBe("auto_accept");
    expect(routeMatchByConfidence(0.95)).toBe("auto_accept");
    expect(routeMatchByConfidence(0.98)).toBe("auto_accept");
    expect(shouldPersistMatch(0.9)).toBe(true);
    expect(shouldQueueForReview(0.9)).toBe(false);
  });

  it("queues review zone 0.60–0.89", () => {
    expect(routeMatchByConfidence(0.6)).toBe("review");
    expect(routeMatchByConfidence(0.75)).toBe("review");
    expect(routeMatchByConfidence(0.89)).toBe("review");
    expect(shouldPersistMatch(0.88)).toBe(false);
    expect(shouldQueueForReview(0.88)).toBe(true);
  });

  it("rejects below 0.60", () => {
    expect(routeMatchByConfidence(0.59)).toBe("reject");
    expect(routeMatchByConfidence(0.28)).toBe("reject");
    expect(routeMatchByConfidence(0)).toBe("reject");
    expect(shouldPersistMatch(0.59)).toBe(false);
    expect(shouldQueueForReview(0.59)).toBe(false);
  });

  it("exports stable threshold constants", () => {
    expect(MATCH_AUTO_ACCEPT_THRESHOLD).toBe(0.9);
    expect(MATCH_REVIEW_MIN_THRESHOLD).toBe(0.6);
  });
});
