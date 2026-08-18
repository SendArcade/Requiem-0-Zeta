/** Per-SKU comp pool diagnostic — why matches ≠ oracle nComps. */
import { closeDb } from "@beyoracle/db";
import { runWave0CompDiag } from "../burst-wave0-comp-diag-lib.js";

const productIds = process.argv.slice(2);

async function main() {
  const reports = await runWave0CompDiag(productIds.length ? productIds : undefined);
  for (const report of reports) {
    console.log(JSON.stringify(report, null, 2));
  }
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exit(1);
});
