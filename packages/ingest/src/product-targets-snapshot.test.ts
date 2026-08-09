import { describe, it, expect } from "vitest";
import {
  buildProductBackfillQueryPlan,
  listPublishableProducts,
  PRIORITY_PRODUCT_IDS,
} from "./product-backfill-query-plan.js";

describe("product target snapshot for quality goal", () => {
  it(
    "reports plastic/metal/burst publishable counts",
    () => {
      const lines: string[] = [];
      for (const g of ["plastic", "metal", "burst"] as const) {
        const ps = listPublishableProducts({ generations: [g] });
        const bySku: Record<string, number> = {};
        for (const p of ps) bySku[p.skuType] = (bySku[p.skuType] ?? 0) + 1;
        lines.push(`${g} publishable=${ps.length} bySku=${JSON.stringify(bySku)}`);
      }
      const all = listPublishableProducts();
      lines.push(`default_total=${all.length}`);
      lines.push(`default_gens=${[...new Set(all.map((p) => p.generation))].sort().join(",")}`);
      lines.push(`priority=${PRIORITY_PRODUCT_IDS.length}`);
      const plan = buildProductBackfillQueryPlan({ maxQueries: 50 });
      lines.push(`plan_capped50=${plan.length}`);
      lines.push(`sample=${JSON.stringify(plan.slice(0, 6))}`);
      console.log(lines.join("\n"));
      expect(all.some((p) => p.generation === "plastic")).toBe(true);
      expect(all.some((p) => p.generation === "metal")).toBe(true);
      expect(all.some((p) => p.generation === "burst")).toBe(true);
      // Full-catalog fleet includes X as well as plastic/metal/burst.
      expect(all.some((p) => p.generation === "x")).toBe(true);
    },
    30_000
  );
});
