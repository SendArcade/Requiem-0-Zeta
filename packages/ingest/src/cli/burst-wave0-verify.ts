/**
 * Souei-style Wave 0 verify against venue bands + matcher stale detection.
 *
 *   pnpm --filter @beyoracle/ingest burst:wave0-verify
 */
import { closeDb } from "@beyoracle/db";
import { formatWave0Verify, verifyWave0 } from "../burst-wave0-verify-lib.js";

async function main() {
  const report = await verifyWave0();
  console.log(formatWave0Verify(report));
  await closeDb();
  process.exit(report.passCount === report.total ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await closeDb();
  process.exit(1);
});
