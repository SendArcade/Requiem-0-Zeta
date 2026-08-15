/**
 * Wave 0 maintenance — purge fast + matcher stale + sealed rematch + recompute.
 *
 *   pnpm --filter @beyoracle/ingest burst:wave0-maintenance
 *   BURST_WAVE0_DRY_RUN=1 pnpm --filter @beyoracle/ingest burst:wave0-maintenance
 *
 * Railway worker one-shot: set BURST_WAVE0_MAINTENANCE=1, redeploy worker, unset after logs.
 */
import { closeDb } from "@beyoracle/db";
import { runBurstWave0Maintenance } from "../burst-wave0-maintenance.js";
import { formatWave0Status } from "../burst-wave0-status-lib.js";
import { formatWave0Verify } from "../burst-wave0-verify-lib.js";
import { verifyWave0 } from "../burst-wave0-verify-lib.js";

async function main() {
  const dryRun = process.env.BURST_WAVE0_DRY_RUN === "1";
  const report = await runBurstWave0Maintenance({ dryRun });
  console.log(JSON.stringify(report, null, 2));
  console.log(formatWave0Status(report.wave0));
  const verify = await verifyWave0();
  console.log(formatWave0Verify(verify));
  await closeDb();
  process.exit(verify.passCount === verify.total ? 0 : 1);
}

main().catch(async (e) => {
  console.error("[burst:wave0-maintenance] failed:", (e as Error).message);
  await closeDb();
  process.exit(1);
});
