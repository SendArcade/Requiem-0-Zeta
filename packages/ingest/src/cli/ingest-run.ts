#!/usr/bin/env tsx
/**
 * One-shot scheduled ingest — persists to Postgres.
 * Usage:
 *   INGEST_ALLOW_FIXTURES=1 pnpm ingest:run
 *   MERCARI_API_ENABLED=1 YAHOO_AUCTIONS_ENABLED=1 pnpm ingest:run
 */
import { closeDb } from "@beyoracle/db";
import { closePublisher } from "@beyoracle/events";
import { runScheduledIngest } from "../scheduled.js";

async function main() {
  const report = await runScheduledIngest();
  console.log(JSON.stringify(report, null, 2));

  if (report.errors.length > 0 && report.inserted === 0 && report.updated === 0) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await closePublisher();
    await closeDb();
  });
