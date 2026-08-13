import { randomUUID } from "node:crypto";
import { getDb, ingestRuns } from "@beyoracle/db";
import { and, desc, eq, lt } from "drizzle-orm";

export interface IngestRunHandle {
  id: string;
  pulse: (stats: Record<string, unknown>) => Promise<void>;
  finish: (result: {
    status: "success" | "failed";
    stats?: Record<string, unknown> | object;
    errors?: string[];
  }) => Promise<void>;
}

/** Short jobs that must not sit in `running` after a crash / hung tick. */
export const SWEEPABLE_INGEST_JOB_NAMES = [
  "cron.tick",
  "ingest.source",
  "ingest.backfill-landed",
] as const;

export const DEFAULT_INGEST_RUN_STALE_MS = 45 * 60 * 1000;

export function ingestRunStaleMs(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.INGEST_RUN_STALE_MS ?? DEFAULT_INGEST_RUN_STALE_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_INGEST_RUN_STALE_MS;
}

export function isRunningIngestRunStale(
  row: { status: string; startedAt: Date },
  staleMs: number = ingestRunStaleMs(),
  now: Date = new Date()
): boolean {
  if (row.status !== "running") return false;
  return now.getTime() - row.startedAt.getTime() >= staleMs;
}

export async function startIngestRun(opts: {
  jobName: string;
  sourceId?: string;
}): Promise<IngestRunHandle> {
  const db = getDb();
  const id = randomUUID();

  await db.insert(ingestRuns).values({
    id,
    jobName: opts.jobName,
    sourceId: opts.sourceId ?? null,
    startedAt: new Date(),
    status: "running",
    stats: {},
    errors: [],
  });

  return {
    id,
    async pulse(stats) {
      await db
        .update(ingestRuns)
        .set({ stats: stats as Record<string, unknown> })
        .where(and(eq(ingestRuns.id, id), eq(ingestRuns.status, "running")));
    },
    async finish(result) {
      // First finish wins — try/finally must not overwrite success with failed.
      await db
        .update(ingestRuns)
        .set({
          finishedAt: new Date(),
          status: result.status,
          stats: (result.stats ?? {}) as Record<string, unknown>,
          errors: result.errors ?? [],
        })
        .where(and(eq(ingestRuns.id, id), eq(ingestRuns.status, "running")));
    },
  };
}

/**
 * Mark stuck `running` rows failed. Skips long jobs (oracle/product backfill)
 * unless `jobNames` is passed.
 */
export async function sweepStaleIngestRuns(opts?: {
  staleMs?: number;
  olderThanMs?: number;
  now?: Date;
  jobNames?: readonly string[];
}): Promise<number> {
  const db = getDb();
  const staleMs = opts?.staleMs ?? opts?.olderThanMs ?? ingestRunStaleMs();
  const now = opts?.now ?? new Date();
  const cutoff = new Date(now.getTime() - staleMs);
  const allow = new Set(opts?.jobNames ?? SWEEPABLE_INGEST_JOB_NAMES);

  const rows = (await db
    .select()
    .from(ingestRuns)
    .where(
      and(eq(ingestRuns.status, "running"), lt(ingestRuns.startedAt, cutoff))
    )) as Array<{
    id: string;
    jobName: string;
    status: string;
    startedAt: Date;
  }>;

  let swept = 0;
  for (const row of rows) {
    if (!allow.has(row.jobName)) continue;
    if (!isRunningIngestRunStale(row, staleMs, now)) continue;
    await db
      .update(ingestRuns)
      .set({
        finishedAt: now,
        status: "failed",
        errors: [`stale: running > ${staleMs}ms`],
      })
      .where(and(eq(ingestRuns.id, row.id), eq(ingestRuns.status, "running")));
    swept++;
  }

  return swept;
}

/** Latest successful cron tick — for ops dashboards / health checks. */
export async function getLastSuccessfulIngestRun(jobName: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(ingestRuns)
    .where(eq(ingestRuns.jobName, jobName))
    .orderBy(desc(ingestRuns.startedAt))
    .limit(20);

  return rows.filter((r) => r.status === "success").at(-1) ?? null;
}
