import { randomUUID } from "node:crypto";
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
  sweepStaleIngestRuns,
} from "@beyoracle/ingest";

const ALERTS_DELAY_MS = Number(process.env.ALERTS_DELAY_MS ?? 90_000);

/** Stable BullMQ repeatable / job-scheduler id — payload must not freeze tickId. */
export const SCHEDULED_CRON_JOB_ID = "scheduled-cron-tick";
export const CRON_REPEATABLE_JOB_ID = SCHEDULED_CRON_JOB_ID;

export function ingestSourceJobId(sourceId: string, tickId: string): string {
  return ("ingest-" + sourceId + "-" + tickId).slice(0, 200);
}

export function alertsJobId(tickId: string): string {
  return ("alerts-" + tickId).slice(0, 200);
}

export function newTickId(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${ts}-${randomUUID().slice(0, 8)}`;
}

/**
 * Fresh tickId per fire so ingest/alerts jobIds never collide.
 * Repeatable Redis jobs freeze their template payload — do not read tickId from it.
 */
export async function dispatchCronTick(
  queue: Queue,
  _payload?: CronTickPayload
): Promise<{ sourcesEnqueued: number; tickId: string }> {
  const tickId = newTickId();

  try {
    const swept = await sweepStaleIngestRuns();
    if (swept > 0) {
      console.log("[worker] swept " + swept + " stale ingest_runs before " + CRON_TICK);
    }
  } catch (err) {
    console.warn("[worker] sweepStaleIngestRuns failed:", (err as Error).message);
  }

  const run = await startIngestRun({ jobName: CRON_TICK });
  let sourcesEnqueued = 0;
  let status: "success" | "failed" = "failed";
  const errors: string[] = [];
  let stats: Record<string, unknown> = { tickId };

  try {
    const pauseCronIngest =
      process.env.BACKFILL_PAUSE_CRON_INGEST !== "0" && isBackfillInFlight();
    if (pauseCronIngest) {
      console.log(
        "[worker] cron.tick: oracle backfill in flight — skipping ingest.source fan-out"
      );
      status = "success";
      stats = { sourcesEnqueued: 0, backfillPausedCron: true, tickId };
      return { sourcesEnqueued: 0, tickId };
    }

    const queries = buildIngestQueryPlan();
    const sources = listEnabledSources();

    for (const sourceId of sources) {
      const data: IngestSourcePayload = {
        sourceId,
        queries,
        tickId,
      };
      try {
        await queue.add(INGEST_SOURCE, parseJobPayload(INGEST_SOURCE, data), {
          jobId: ingestSourceJobId(sourceId, tickId),
          ...bullmqOptsForJob(INGEST_SOURCE),
        });
      } catch (err) {
        errors.push(`${sourceId}: ${(err as Error).message}`);
      }
    }

    await queue.add(
      ALERTS_CHECK,
      parseJobPayload(ALERTS_CHECK, { tickId }),
      {
        jobId: alertsJobId(tickId),
        delay: ALERTS_DELAY_MS,
        ...bullmqOptsForJob(ALERTS_CHECK),
      }
    );

    sourcesEnqueued = sources.length;
    stats = { sourcesEnqueued, queries: queries.length, tickId };
    status = errors.length ? "failed" : "success";
    return { sourcesEnqueued, tickId };
  } catch (err) {
    errors.push((err as Error).message);
    stats = { ...stats, tickId };
    throw err;
  } finally {
    await run.finish({ status, stats, errors });
  }
}

function isScheduledCronRepeatable(job: {
  id?: string | null;
  name?: string;
  key?: string;
}): boolean {
  const id = job.id ?? "";
  const name = job.name ?? "";
  const key = job.key ?? "";
  return (
    id === SCHEDULED_CRON_JOB_ID ||
    name === CRON_TICK ||
    key.includes(SCHEDULED_CRON_JOB_ID) ||
    key.includes(CRON_TICK)
  );
}

/**
 * Drop the Aug-5 frozen scheduled-cron-tick template (and any leftover delayed
 * cron.tick jobs) so pause flags actually take effect, then re-add a payload-free
 * scheduler when cron is not paused.
 */
export async function syncScheduledCronTick(
  queue: Queue,
  opts: { pause: boolean; intervalMs: number }
): Promise<{ removed: number; added: boolean }> {
  let removed = 0;

  const repeatables = await queue.getRepeatableJobs();
  for (const job of repeatables) {
    if (isScheduledCronRepeatable(job)) {
      await queue.removeRepeatableByKey(job.key);
      removed++;
    }
  }

  const schedulersApi = queue as Queue & {
    getJobSchedulers?: () => Promise<Array<{ id?: string | null; name?: string }>>;
    removeJobScheduler?: (id: string) => Promise<unknown>;
  };
  if (typeof schedulersApi.removeJobScheduler === "function") {
    try {
      await schedulersApi.removeJobScheduler(SCHEDULED_CRON_JOB_ID);
      removed++;
    } catch {
      // already gone / older BullMQ without this scheduler id
    }
  }

  const delayed = await queue.getDelayed();
  for (const job of delayed) {
    if (job.name === CRON_TICK) {
      await job.remove();
      removed++;
    }
  }

  if (opts.pause) {
    return { removed, added: false };
  }

  await queue.add(
    CRON_TICK,
    parseJobPayload(CRON_TICK, { triggeredAt: new Date().toISOString() }),
    {
      repeat: { every: opts.intervalMs },
      jobId: SCHEDULED_CRON_JOB_ID,
      ...bullmqOptsForJob(CRON_TICK),
    }
  );

  return { removed, added: true };
}

export { CONTROL_QUEUE };
