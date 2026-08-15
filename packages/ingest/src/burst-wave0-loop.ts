/**
 * Autonomous Wave 0 loop — ingest/rematch/purge/verify until 7/7 PASS or max iterations.
 * Railway: BURST_WAVE0_LOOP=1 on worker boot (background).
 */
import { runBurstWave0Ingest } from "./burst-wave0-ingest.js";
import { resetYahooLiveCircuitForWave0 } from "./adapters/yahoo-auctions-jp.js";
import type { Wave0VerifyReport } from "./burst-wave0-verify-lib.js";

export type BurstWave0LoopReport = {
  iterations: number;
  maxIterations: number;
  complete: boolean;
  finalVerify: Wave0VerifyReport | null;
  iterationSummaries: Array<{
    iteration: number;
    passCount: number;
    failing: string[];
    inserted: number;
    matched: number;
    rematchLoose: number;
    rematchGap: number;
    purgeBelowBand: number;
  }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runBurstWave0Loop(opts: {
  dryRun?: boolean;
  maxIterations?: number;
  pauseMs?: number;
  closeDb?: boolean;
} = {}): Promise<BurstWave0LoopReport> {
  const dryRun = opts.dryRun ?? false;
  const maxIterations =
    opts.maxIterations ?? Number(process.env.BURST_WAVE0_LOOP_MAX ?? 8);
  const pauseMs = opts.pauseMs ?? Number(process.env.BURST_WAVE0_LOOP_PAUSE_MS ?? 15_000);
  const closeDbAfter = opts.closeDb ?? true;

  const report: BurstWave0LoopReport = {
    iterations: 0,
    maxIterations,
    complete: false,
    finalVerify: null,
    iterationSummaries: [],
  };

  console.log(`[burst:wave0-loop] start maxIterations=${maxIterations} dryRun=${dryRun}`);

  for (let iter = 1; iter <= maxIterations; iter++) {
    report.iterations = iter;
    console.log(`[burst:wave0-loop] ── iteration ${iter}/${maxIterations} ──`);
    resetYahooLiveCircuitForWave0();

    const ingest = await runBurstWave0Ingest({
      dryRun,
      skipIngest: false,
      skipVerify: false,
      closeDb: false,
      maxQueries:
        iter === 1
          ? undefined
          : Number(process.env.WAVE0_INGEST_MAX_QUERIES ?? 24) + (iter - 1) * 12,
    });

    const verify = ingest.verify;
    const passCount = verify?.passCount ?? 0;
    const failing =
      verify?.rows.filter((r) => !r.pass).map((r) => `${r.bCode}(${r.reasons.join(",")})`) ??
      [];

    report.iterationSummaries.push({
      iteration: iter,
      passCount,
      failing,
      inserted: ingest.inserted,
      matched: ingest.matched,
      rematchLoose: ingest.rematchLoose.matched,
      rematchGap: ingest.rematchGap.matched,
      purgeBelowBand: ingest.purgeBelowBand.purged,
    });

    report.finalVerify = verify;

    console.log(`[burst:wave0-loop] iteration ${iter} result: ${passCount}/7 PASS`);
    if (failing.length > 0) {
      console.log(`[burst:wave0-loop] still failing: ${failing.join("; ")}`);
    }

    if (passCount === 7) {
      report.complete = true;
      console.log(`[burst:wave0-loop] DONE — 7/7 PASS on iteration ${iter}`);
      break;
    }

    if (iter < maxIterations) {
      console.log(`[burst:wave0-loop] pausing ${pauseMs}ms before retry…`);
      await sleep(pauseMs);
    }
  }

  if (!report.complete) {
    console.log(
      `[burst:wave0-loop] STOP — ${report.finalVerify?.passCount ?? 0}/7 after ${report.iterations} iterations`
    );
  }

  if (closeDbAfter) {
    const { closeDb } = await import("@beyoracle/db");
    await closeDb();
  }

  return report;
}
