import type { Job } from "bullmq";
import {
  ALERTS_CHECK,
  CRON_TICK,
  INGEST_BACKFILL_LANDED,
  INGEST_SOURCE,
  ORACLE_RECOMPUTE,
  POLL_SOURCES,
  PRODUCT_BACKFILL_SHARD,
  parseJobPayload,
  type AlertsCheckPayload,
  type IngestBackfillLandedPayload,
  type IngestSourcePayload,
  type OracleRecomputePayload,
  type ProductBackfillShardPayload,
} from "@beyoracle/jobs";
import {
  backfillLandedJpy,
  recomputeOracleSnapshotsBatch,
  runProductBackfillShard,
  runScheduledIngest,
  runSourceIngest,
} from "@beyoracle/ingest";
import { checkWatchlistAlerts } from "./alerts.js";
import { dispatchCronTick } from "./dispatch.js";
import type { Queue } from "bullmq";

export interface JobMetrics {
  jobName: string;
  durationMs: number;
  outcome: "success" | "failure";
}

export async function handleJob(
  job: Job,
  queue: Queue
): Promise<unknown> {
  switch (job.name) {
      case CRON_TICK: {
        const payload = parseJobPayload(CRON_TICK, job.data);
        const result = await dispatchCronTick(queue, payload);
        console.log(
          `[worker] ${CRON_TICK} ${payload.tickId}: enqueued ${result.sourcesEnqueued} source jobs`
        );
        return result;
      }

      case INGEST_SOURCE: {
        const payload = parseJobPayload(INGEST_SOURCE, job.data) as IngestSourcePayload;
        const report = await runSourceIngest({
          sourceId: payload.sourceId,
          queries: payload.queries,
          limitPerQuery: payload.limitPerQuery,
        });
        console.log(
          `[worker] ${INGEST_SOURCE} ${payload.sourceId}: +${report.inserted} new, ${report.matched} matched`
        );
        if (report.errors.length) {
          console.warn(`[worker] ${payload.sourceId} errors:`, report.errors.join("; "));
        }
        return report;
      }

      case ORACLE_RECOMPUTE: {
        const payload = parseJobPayload(ORACLE_RECOMPUTE, job.data) as OracleRecomputePayload;
        await recomputeOracleSnapshotsBatch(payload.partIds);
        return { recomputed: payload.partIds.length, reason: payload.reason };
      }

      case ALERTS_CHECK: {
        parseJobPayload(ALERTS_CHECK, job.data) as AlertsCheckPayload;
        const alerts = await checkWatchlistAlerts();
        console.log(
          `[worker] ${ALERTS_CHECK}: checked ${alerts.checked}, fired ${alerts.alertsFired}`
        );
        return alerts;
      }

      case INGEST_BACKFILL_LANDED: {
        const payload = parseJobPayload(
          INGEST_BACKFILL_LANDED,
          job.data
        ) as IngestBackfillLandedPayload;
        return backfillLandedJpy({
          batchSize: payload.batchSize,
          cursor: payload.cursor,
        });
      }

      case PRODUCT_BACKFILL_SHARD: {
        const payload = parseJobPayload(
          PRODUCT_BACKFILL_SHARD,
          job.data
        ) as ProductBackfillShardPayload;
        const report = await runProductBackfillShard({
          shardId: payload.shardId,
          shardCount: payload.shardCount,
          generations: payload.generations,
          priorityOnly: payload.priorityOnly,
          maxQueries: payload.maxQueries,
          maxProducts: payload.maxProducts,
          closeDb: false,
        });
        console.log(
          `[worker] ${PRODUCT_BACKFILL_SHARD} ${payload.shardId}/${payload.shardCount}: ` +
            `products=${report.productsTargeted} queries=${report.queriesTotal} ` +
            `+${report.inserted} matched=${report.matched} recomputed=${report.productsRecomputed}`
        );
        if (report.errors.length) {
          console.warn(
            `[worker] shard ${payload.shardId} errors:`,
            report.errors.slice(0, 5).join("; ")
          );
        }
        return report;
      }

      case POLL_SOURCES: {
        // Legacy monolith path — kept for manual CLI triggers.
        return runScheduledIngest();
      }

      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
}

export function logJobMetrics(metrics: JobMetrics): void {
  console.log(
    `[worker] job.${metrics.jobName} ${metrics.outcome} ${metrics.durationMs}ms`
  );
}
