/**
 * Autonomous Wave 0 loop CLI — local/Railway tunnel only (needs Postgres).
 *
 *   pnpm --filter @beyoracle/ingest burst:wave0-loop
 *   BURST_WAVE0_LOOP_MAX=12 pnpm --filter @beyoracle/ingest burst:wave0-loop
 *
 * Railway worker one-shot: BURST_WAVE0_LOOP=1 on boot (preferred for production DB).
 */
import { runBurstWave0Loop } from "../burst-wave0-loop.js";
import { formatWave0Verify } from "../burst-wave0-verify-lib.js";

async function main() {
  const dryRun = process.env.BURST_WAVE0_DRY_RUN === "1";
  const maxIterations = process.env.BURST_WAVE0_LOOP_MAX
    ? Number(process.env.BURST_WAVE0_LOOP_MAX)
    : undefined;

  const report = await runBurstWave0Loop({
    dryRun,
    maxIterations,
    closeDb: true,
  });

  if (report.finalVerify) {
    console.log(formatWave0Verify(report.finalVerify));
  }

  console.log(
    `[burst:wave0-loop] complete=${report.complete} iterations=${report.iterations}/${report.maxIterations}`
  );
  console.log(JSON.stringify(report));

  if (!report.complete) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[burst:wave0-loop] failed:", (err as Error).message);
  process.exit(1);
});
