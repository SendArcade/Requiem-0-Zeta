import type { JobName } from "./names.js";

export interface JobRetryPolicy {
  attempts: number;
  backoff: { type: "exponential" | "fixed"; delay: number };
  removeOnComplete: number | boolean;
  removeOnFail: number | boolean;
}

/** Per-job retry + retention — mirrors warmachine/packages/jobs/config.ts. */
export const RETRY_POLICIES: Record<JobName, JobRetryPolicy> = {
  "cron.tick": {
    attempts: 2,
    backoff: { type: "fixed", delay: 30_000 },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
  "ingest.source": {
    attempts: 4,
    backoff: { type: "exponential", delay: 60_000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  "oracle.recompute": {
    attempts: 3,
    backoff: { type: "exponential", delay: 15_000 },
    removeOnComplete: 200,
    removeOnFail: 100,
  },
  "alerts.check": {
    attempts: 2,
    backoff: { type: "fixed", delay: 10_000 },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
  "ingest.backfill-landed": {
    attempts: 3,
    backoff: { type: "fixed", delay: 30_000 },
    removeOnComplete: 20,
    removeOnFail: 10,
  },
  "product.backfill.shard": {
    attempts: 3,
    backoff: { type: "exponential", delay: 120_000 },
    removeOnComplete: 500,
    removeOnFail: 200,
  },
  "poll-sources": {
    attempts: 2,
    backoff: { type: "fixed", delay: 60_000 },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
};

export function bullmqOptsForJob(name: JobName) {
  const p = RETRY_POLICIES[name];
  return {
    attempts: p.attempts,
    backoff: p.backoff,
    removeOnComplete: p.removeOnComplete,
    removeOnFail: p.removeOnFail,
  };
}

/** Default 60m lock — product.backfill.shard runs many live API calls past 10m. */
export const DEFAULT_BULLMQ_LOCK_DURATION_MS = 60 * 60 * 1000;
export const DEFAULT_BULLMQ_LOCK_RENEW_MS = 30_000;

export function bullmqWorkerLockOpts(
  env: Record<string, string | undefined> = {}
): {
  lockDuration: number;
  lockRenewTime: number;
} {
  const lockDuration = Number(
    env.BULLMQ_LOCK_DURATION_MS ?? DEFAULT_BULLMQ_LOCK_DURATION_MS
  );
  const lockRenewTime = Number(
    env.BULLMQ_LOCK_RENEW_MS ??
      Math.min(
        DEFAULT_BULLMQ_LOCK_RENEW_MS,
        Math.max(5_000, Math.floor(lockDuration / 3))
      )
  );
  return { lockDuration, lockRenewTime };
}
