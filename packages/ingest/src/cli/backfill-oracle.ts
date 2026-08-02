#!/usr/bin/env tsx
/**
 * Full-catalog oracle backfill — fixtures + live ingest + recompute all marks.
 *
 * Usage:
 *   pnpm backfill:oracle
 *   BACKFILL_MAX_QUERIES=100 pnpm backfill:oracle
 *   SKIP_LIVE=1 pnpm backfill:oracle   # fixtures + recompute only
 */
import { closeDb } from "@beyoracle/db";
import { closePublisher } from "@beyoracle/events";
import { runOracleBackfill } from "../backfill-oracle.js";

async function main() {
  const report = await runOracleBackfill({
    skipLiveIngest: process.env.SKIP_LIVE === "1",
    skipFixtures: process.env.SKIP_FIXTURES === "1",
    skipLanded: process.env.SKIP_LANDED === "1",
    maxQueries: process.env.BACKFILL_MAX_QUERIES
      ? Number(process.env.BACKFILL_MAX_QUERIES)
      : undefined,
  });

  console.log(JSON.stringify(report, null, 2));

  if (
    report.errors.length > 0 &&
    report.inserted === 0 &&
    report.fixtureMatched === 0
  ) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await closePublisher();
    await closeDb();
  });
