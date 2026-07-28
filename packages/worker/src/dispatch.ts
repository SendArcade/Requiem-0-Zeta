import type { Queue } from "bullmq";
import {
  ALERTS_CHECK,
  bullmqOptsForJob,
  CONTROL_QUEUE,
  CRON_TICK,
  INGEST_SOURCE,
  parseJobPayload,
  type CronTickPayload,
  type IngestSourcePayload,
} from "@beyoracle/jobs";
import {
  buildIngestQueryPlan,
  isBackfillInFlight,
  listEnabledSources,
  startIngestRun,
} from "@beyoracle/ingest";

const ALERTS_DELAY_MS = Number(process.env.ALERTS_DELAY_MS ?? 90_000);

/** War Machine cron.fire pattern — tick fans out to domain jobs, never does I/O itself. */
export async function dispatchCronTick(
  queue: Queue,
  payload: CronTickPayload
): Promise<{ sourcesEnqueued: number }> {
  const run = await startIngestRun({ jobName: CRON_TICK });
  const pauseCronIngest =
    process.env.BACKFILL_PAUSE_CRON_INGEST !== "0" && isBackfillInFlight();
  if (pauseCronIngest) {
    console.log(
      "[worker] cron.tick: oracle backfill in flight — skipping ingest.source fan-out"
    );
    await run.finish({
      status: "success",
      stats: { sourcesEnqueued: 0, backfillPausedCron: true },
      errors: [],
    });
    return { sourcesEnqueued: 0 };
  }

  const queries = buildIngestQueryPlan();
  const sources = listEnabledSources();
  const errors: string[] = [];

  for (const sourceId of sources) {
    const data: IngestSourcePayload = {
      sourceId,
      queries,
      tickId: payload.tickId,
    };
    try {
      await queue.add(INGEST_SOURCE, parseJobPayload(INGEST_SOURCE, data), {
        jobId: `ingest-${sourceId}-${payload.tickId}`.slice(0, 200),
        ...bullmqOptsForJob(INGEST_SOURCE),
      });
    } catch (err) {
      errors.push(`${sourceId}: ${(err as Error).message}`);
    }
  }

  // Alerts run after ingest jobs have time to finish — not coupled to last ingest job.
  await queue.add(
    ALERTS_CHECK,
    parseJobPayload(ALERTS_CHECK, { tickId: payload.tickId }),
    {
      jobId: `alerts-${payload.tickId}`.slice(0, 200),
      delay: ALERTS_DELAY_MS,
      ...bullmqOptsForJob(ALERTS_CHECK),
    }
  );

  await run.finish({
    status: errors.length ? "failed" : "success",
    stats: { sourcesEnqueued: sources.length, queries: queries.length },
    errors,
  });

  return { sourcesEnqueued: sources.length };
}

export function newTickId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export { CONTROL_QUEUE };
