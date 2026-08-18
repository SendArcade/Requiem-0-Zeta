#!/usr/bin/env tsx
/**
 * Wave 1 burst expansion ingest — B-01, B-102, B-168 + Wave 0 sealed rows.
 *
 *   pnpm --filter @beyoracle/ingest burst:wave1-ingest
 *   BURST_WAVE1_DRY_RUN=1 pnpm --filter @beyoracle/ingest burst:wave1-ingest
 */
import { runBurstWave1Ingest } from "../burst-wave1-ingest.js";

async function main() {
  const report = await runBurstWave1Ingest({
    dryRun: process.env.BURST_WAVE1_DRY_RUN === "1",
    skipIngest: process.env.BURST_WAVE1_SKIP_INGEST === "1",
    closeDb: true,
  });
  console.log("[burst:wave1-ingest] complete:", JSON.stringify(report));
}

main().catch((err) => {
  console.error("[burst:wave1-ingest] failed:", (err as Error).message);
  process.exit(1);
});
