/**
 * Targeted Wave 0 gap ingest for B-110 / B-97 / B-104.
 *
 *   pnpm --filter @beyoracle/ingest burst:wave0-ingest
 *   BURST_WAVE0_DRY_RUN=1 pnpm --filter @beyoracle/ingest burst:wave0-ingest
 *
 * Railway worker one-shot: set BURST_WAVE0_INGEST=1, redeploy worker, unset after logs.
 */
import { runBurstWave0Ingest } from "../burst-wave0-ingest.js";

async function main() {
  const dryRun = process.env.BURST_WAVE0_DRY_RUN === "1";
  const skipIngest = process.env.BURST_WAVE0_SKIP_INGEST === "1";
  const skipVerify = process.env.BURST_WAVE0_SKIP_VERIFY === "1";

  const report = await runBurstWave0Ingest({
    dryRun,
    skipIngest,
    skipVerify,
    closeDb: true,
  });

  console.log("[burst:wave0-ingest] complete:", JSON.stringify(report));
}

main().catch((err) => {
  console.error("[burst:wave0-ingest] failed:", (err as Error).message);
  process.exit(1);
});
