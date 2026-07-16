import { describe, expect, it } from "vitest";
import {
  feedsOracleMark,
  resolveEvidenceKind,
  SOURCE_DEFAULT_EVIDENCE,
} from "./provenance.js";

describe("provenance", () => {
  it("defaults JP sold corridors to confirmed_sale", () => {
    expect(SOURCE_DEFAULT_EVIDENCE.mercari_jp).toBe("confirmed_sale");
    expect(SOURCE_DEFAULT_EVIDENCE.yahoo_auctions_jp).toBe("confirmed_sale");
  });

  it("maps Ruten sold_proxy to dealer proxy", () => {
    expect(
      resolveEvidenceKind("ruten_tw", { priceKind: "sold_proxy", compEligible: true })
    ).toBe("dealer_sold_out_proxy");
    expect(feedsOracleMark("dealer_sold_out_proxy")).toBe(false);
  });

  it("maps Suruga-ya sold-out stub to dealer proxy", () => {
    expect(resolveEvidenceKind("suruga_ya_jp", { priceKind: "sold_out_proxy" })).toBe(
      "dealer_sold_out_proxy"
    );
  });

  it("excludes active asks from oracle mark", () => {
    expect(resolveEvidenceKind("mandarake_jp", { priceKind: "ask" })).toBe("active_ask");
    expect(feedsOracleMark("active_ask")).toBe(false);
  });

  it("treats compEligible=false as active ask", () => {
    expect(resolveEvidenceKind("ruten_tw", { compEligible: false })).toBe("active_ask");
  });
});

import { computeLandedJpySync } from "./landed-price.js";

describe("computeLandedJpy string coercion", () => {
  it("does not 10x JPY prices when price is a numeric string", () => {
    const r = computeLandedJpySync({
      source: "mercari_jp",
      price: "10000" as unknown as number,
      currency: "JPY",
      observedAt: new Date(),
    });
    expect(r.landedJpy).toBe(10000);
    expect(r.fxRateAtSale).toBe(1);
  });
});
