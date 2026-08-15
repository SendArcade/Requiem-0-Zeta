/**
 * Multi-generation oracle loop CLI (burst / plastic / metal).
 *
 *   GENERATION_ORACLE_LOOP=burst,plastic,metal pnpm --filter @beyoracle/ingest gen:oracle-loop
 */
import {
  parseGenerationOracleLoops,
  runGenerationOracleLoop,
  runMultiGenerationOracleLoops,
} from "../generation-oracle-loop.js";

async function main() {
  const single = process.env.GENERATION_ORACLE_SINGLE?.trim();
  const loops = parseGenerationOracleLoops();

  if (single && loops.length <= 1) {
    const gen = (single || loops[0]) as import("@beyoracle/shared").Generation;
    const report = await runGenerationOracleLoop({
      generation: gen,
      closeDb: true,
    });
    console.log(JSON.stringify(report));
    if (report.errors.length) process.exit(1);
    return;
  }

  const report = await runMultiGenerationOracleLoops({ closeDb: true });
  console.log(JSON.stringify(report));
}

main().catch((err) => {
  console.error("[gen:oracle-loop] failed:", (err as Error).message);
  process.exit(1);
});
