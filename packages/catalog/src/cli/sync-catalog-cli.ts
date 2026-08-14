/**
 * Live-safe catalog sync — upsert missing parts/products and refresh product identity.
 *
 *   pnpm catalog:sync
 *   pnpm catalog:sync -- --generation=burst
 */
import { closeDb } from "@beyoracle/db";
import type { Generation } from "@beyoracle/shared";
import { syncCatalogIdentity } from "../sync-catalog.js";

function parseGenerationArg(): Generation | undefined {
  const genFlag = process.argv.indexOf("--generation");
  if (genFlag >= 0) {
    const next = process.argv[genFlag + 1];
    if (next && !next.startsWith("-")) return next as Generation;
  }
  const eqArg = process.argv.find((a) => a.startsWith("--generation="));
  if (eqArg) return eqArg.slice("--generation=".length) as Generation;
  return undefined;
}

async function main() {
  const generation = parseGenerationArg();
  const generations = generation ? [generation] : undefined;

  const report = await syncCatalogIdentity({ generations });

  console.log("[catalog:sync] live-safe identity sync");
  if (generations) console.log(`  scope: ${generations.join(", ")}`);
  console.log(`  parts inserted:     ${report.partsInserted}`);
  console.log(`  aliases inserted:   ${report.aliasesInserted}`);
  console.log(`  products inserted:  ${report.productsInserted}`);
  console.log(`  products updated:   ${report.productsUpdated}`);
  console.log(`  recipe links added: ${report.productPartLinksInserted}`);

  await closeDb();
}

main().catch(async (err) => {
  console.error("[catalog:sync] failed:", (err as Error).message);
  await closeDb();
  process.exit(1);
});
