import { getDb, observations } from "@beyoracle/db";
import { computeLandedJpy } from "@beyoracle/shared";
import type { Currency, SourceId } from "@beyoracle/shared";
import { eq, desc, or, isNull, lt } from "drizzle-orm";
import { startIngestRun } from "./runs.js";

export interface BackfillLandedReport {
  processed: number;
  updated: number;
  hasMore: boolean;
  nextCursor?: string;
  errors: string[];
}

/** Repair queue: populate landed_jpy on legacy rows (War Machine indexer.repair pattern). */
export async function backfillLandedJpy(opts?: {
  batchSize?: number;
  cursor?: string;
}): Promise<BackfillLandedReport> {
  const batchSize = opts?.batchSize ?? 200;
  const run = await startIngestRun({ jobName: "ingest.backfill-landed" });

  const db = getDb();
  const report: BackfillLandedReport = {
    processed: 0,
    updated: 0,
    hasMore: false,
    errors: [],
  };

  try {
    const rows = await db
      .select()
      .from(observations)
      .where(
        or(isNull(observations.landedJpy), lt(observations.landedJpy, 1))
      )
      .orderBy(observations.id)
      .limit(batchSize + 1);

    let slice = rows;
    if (opts?.cursor) {
      slice = rows.filter((r) => r.id > opts.cursor!);
    }

    const batch = slice.slice(0, batchSize);
    report.hasMore = slice.length > batchSize;
    if (batch.length > 0) {
      report.nextCursor = batch[batch.length - 1]!.id;
    }

    for (const row of batch) {
      report.processed++;
      try {
        const landed = await computeLandedJpy({
          source: row.source as SourceId,
          price: row.price,
          currency: row.currency as Currency,
          observedAt: row.observedAt,
          rawJson: row.rawJson,
        });

        await db
          .update(observations)
          .set({
            landedJpy: landed.landedJpy,
            fxRateAtSale: landed.fxRateAtSale,
            shippingJpy: landed.shippingJpy,
          })
          .where(eq(observations.id, row.id));

        report.updated++;
      } catch (err) {
        report.errors.push(`${row.id}: ${(err as Error).message}`);
      }
    }

    await run.finish({
      status: report.errors.length ? "failed" : "success",
      stats: report,
      errors: report.errors,
    });
  } catch (err) {
    report.errors.push((err as Error).message);
    await run.finish({ status: "failed", stats: report, errors: report.errors });
  }

  return report;
}
