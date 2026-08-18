#!/usr/bin/env tsx
import { formatWave1Status, summarizeWave1Status } from "../burst-wave1-status-lib.js";
import { closeDb } from "@beyoracle/db";

async function main() {
  const summary = await summarizeWave1Status();
  console.log(formatWave1Status(summary));
  await closeDb();
}

main().catch((err) => {
  console.error("[burst:wave1-status] failed:", (err as Error).message);
  process.exit(1);
});
