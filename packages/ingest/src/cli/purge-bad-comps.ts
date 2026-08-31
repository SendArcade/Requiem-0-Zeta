/**
 * Re-validate persisted matches against matcher v3.1 + product firewall.
 * Default: delete bad match rows only — observations preserved for re-match.
 *
 *   pnpm purge:bad-comps              # apply + recompute touched only
 *   PURGE_DRY_RUN=1 pnpm purge:bad-comps
 *   PURGE_GENERATIONS=burst PURGE_SKIP_PART_MATCHES=1 pnpm purge:bad-comps
 *   PURGE_TITLE_GATES_ONLY=1 pnpm purge:bad-comps   # fast junk purge (~5s/row rematch skipped)
 *   PURGE_DELETE_OBSERVATIONS=1 pnpm purge:bad-comps   # legacy full delete
 */
import type { Generation } from "@beyoracle/shared";
import { purgeBadComps } from "../purge-bad-comps.js";

function parseGenerations(): Generation[] | undefined {
  const raw = process.env.PURGE_GENERATIONS?.trim();
  if (!raw) return undefined;
  return raw.split(",").map((s) => s.trim()).filter(Boolean) as Generation[];
}

async function main() {
  const dryRun = process.env.PURGE_DRY_RUN === "1" || process.argv.includes("--dry-run");
  const deleteObservations =
    process.env.PURGE_DELETE_OBSERVATIONS === "1" ||
    process.argv.includes("--delete-observations");
  const generations = parseGenerations();
  const skipPartMatches = process.env.PURGE_SKIP_PART_MATCHES === "1";
  const titleGatesOnly = process.env.PURGE_TITLE_GATES_ONLY === "1";

  if (generations?.length) {
    console.log(`[purge] scope: generations=${generations.join(",")}`);
  }
  if (skipPartMatches) console.log("[purge] skipping part-level matches");
  if (titleGatesOnly) console.log("[purge] title-gates-only (no full rematch)");

  const result = await purgeBadComps({
    dryRun,
    deleteObservations,
    generations,
    skipPartMatches,
    titleGatesOnly,
  });
  const totalBad = result.badPartMatches + result.badProductMatches;

  if (totalBad === 0) {
    console.log("[purge] no stale matches found");
    return;
  }

  const mode = dryRun ? "dry-run" : "apply";
  console.log(
    `[purge:${mode}] ${result.badPartMatches} part + ${result.badProductMatches} product matches flagged`
  );

  if (deleteObservations) {
    console.log(`[purge:${mode}] deleted ${result.purgedObservations} observations`);
  } else if (!dryRun) {
    console.log(
      `[purge:${mode}] preserved ${result.preservedObservations} observations (match rows removed only)`
    );
  } else {
    console.log(
      `[purge:${mode}] would preserve ${result.preservedObservations} observations`
    );
  }

  if (result.samples.length > 0) {
    console.log(`[purge:${mode}] samples:`);
    for (const s of result.samples) console.log(`  - ${s}`);
  }

  if (!dryRun) {
    console.log(
      `[purge] recomputed oracle: ${result.recomputedParts} parts, ${result.recomputedProducts} products`
    );
  }
}

main().catch((err) => {
  console.error("[purge] failed:", (err as Error).message);
  process.exit(1);
});
