/** Wave 0 starter + sealed mark status on Railway. */
import { closeDb } from "@beyoracle/db";
import { formatWave0Status, summarizeWave0Status } from "../burst-wave0-status-lib.js";

async function main() {
  const summary = await summarizeWave0Status();
  console.log(formatWave0Status(summary));
  await closeDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeDb();
  process.exit(1);
});
