import { describe, expect, it } from "vitest";
import { computeRetailReference } from "./retail-reference.js";

describe("computeRetailReference", () => {
  it("medians Walmart shelf asks in USD", () => {
    const ref = computeRetailReference([
      {
        price: 14.97,
        currency: "USD",
        source: "walmart_us",
        status: "listing",
      },
      {
        price: 19.97,
        currency: "USD",
        source: "walmart_us",
        status: "listing",
      },
    ]);

    expect(ref).toMatchObject({
      value: 17.47,
      currency: "USD",
      nAsks: 2,
      sources: ["walmart_us"],
    });
  });

  it("combines Walmart and Amazon shelf asks", () => {
    const ref = computeRetailReference([
      {
        price: 14.97,
        currency: "USD",
        source: "walmart_us",
        status: "listing",
      },
      {
        price: 19.99,
        currency: "USD",
        source: "amazon_us",
        status: "listing",
      },
    ]);

    expect(ref).toMatchObject({
      value: 17.48,
      nAsks: 2,
      sources: ["walmart_us", "amazon_us"],
    });
  });

  it("ignores sold comps and JP sources", () => {
    expect(
      computeRetailReference([
        {
          price: 1499,
          currency: "JPY",
          source: "mercari_jp",
          status: "sold",
        },
      ])
    ).toBeNull();
  });
});
