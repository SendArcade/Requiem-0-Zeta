#!/usr/bin/env tsx
/**
 * Backfill landed_jpy / fx_rate_at_sale / shipping_jpy on legacy observations.
 * Usage: pnpm --filter @beyoracle/ingest backfill:landed
 *        pnpm --filter @beyoracle/ingest backfill:landed -- --batch 500
 */
import { closeDb } from "@beyoracle/db";
import { backfillLandedJpy } from "../backfill-landed.js";

async function main() {
  const batchArg = process.argv.find((a) => a.startsWith("--batch="));
  const batchSize = batchArg ? Number(batchArg.split("=")[1]) : 200;
  let cursor: string | undefined;
  let totalUpdated = 0;
  let rounds = 0;

  do {
    const report = await backfillLandedJpy({ batchSize, cursor });
    totalUpdated += report.updated;
    rounds++;
    console.log(
      JSON.stringify({
        round: rounds,
        processed: report.processed,
        updated: report.updated,
        hasMore: report.hasMore,
        errors: report.errors.length,
      })
    );
    if (report.errors.length) {
      console.warn("errors:", report.errors.slice(0, 5).join("; "));
    }
    cursor = report.hasMore ? report.nextCursor : undefined;
  } while (cursor);

  console.log(`Done: ${totalUpdated} rows updated in ${rounds} batch(es)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
