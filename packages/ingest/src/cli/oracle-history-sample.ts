/**
 * Sample multi-month product oracle history from retained DB comps (one SKU per gen).
 */
import { closeDb, getDb, observations, productMatches } from "@beyoracle/db";
import { buildTimeSeries, computeOracleValue } from "@beyoracle/oracle";
import { DEFAULT_PUBLISHED_MIN_COMPS } from "@beyoracle/shared";
import { eq } from "drizzle-orm";

const samples = [
  "prod-plastic-bb-01s-starter",
  "prod-metal-bb-28-starter",
  "prod-burst-b-34-starter",
];

async function main() {
  const db = getDb();
  for (const productId of samples) {
    const rows = await db
      .select({
        price: observations.price,
        currency: observations.currency,
        source: observations.source,
        observedAt: observations.observedAt,
        status: observations.status,
        condition: observations.condition,
        landedJpy: observations.landedJpy,
      })
      .from(productMatches)
      .innerJoin(observations, eq(productMatches.observationId, observations.id))
      .where(eq(productMatches.productId, productId));

    const comps = rows.map((r) => ({
      price: r.price,
      currency: r.currency as "JPY" | "TWD",
      source: r.source,
      observedAt: r.observedAt,
      status: r.status as "sold" | "listing",
      condition: r.condition ?? undefined,
      landedJpy: r.landedJpy,
    }));

    const current = computeOracleValue(productId, comps, {
      windowDays: 90,
      minComps: DEFAULT_PUBLISHED_MIN_COMPS,
      engine: "v1",
    });
    const long = computeOracleValue(productId, comps, {
      windowDays: 180,
      minComps: DEFAULT_PUBLISHED_MIN_COMPS,
      engine: "v1",
    });
    const series90 = buildTimeSeries(comps, { windowDays: 90 });
    const series180 = buildTimeSeries(comps, { windowDays: 180 });

    console.log(
      JSON.stringify(
        {
          productId,
          rawComps: comps.length,
          dates: comps.map((c) => c.observedAt.toISOString().slice(0, 10)).sort(),
          current90: current
            ? { value: current.value, nComps: current.nComps, confidence: current.confidence }
            : null,
          long180: long ? { value: long.value, nComps: long.nComps } : null,
          series90,
          series180,
          allPointsHaveDates: series180.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date)),
          noSynthetic: series180.length <= comps.filter((c) => c.status === "sold").length,
        },
        null,
        2
      )
    );
  }
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exit(1);
});
