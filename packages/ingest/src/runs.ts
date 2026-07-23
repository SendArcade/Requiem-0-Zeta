import { randomUUID } from "node:crypto";
import { getDb, ingestRuns } from "@beyoracle/db";
import { eq, desc } from "drizzle-orm";

export interface IngestRunHandle {
  id: string;
  pulse: (stats: Record<string, unknown>) => Promise<void>;
  finish: (result: {
    status: "success" | "failed";
    stats?: Record<string, unknown> | object;
    errors?: string[];
  }) => Promise<void>;
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
        .where(eq(ingestRuns.id, id));
    },
    async finish(result) {
      await db
        .update(ingestRuns)
        .set({
          finishedAt: new Date(),
          status: result.status,
          stats: (result.stats ?? {}) as Record<string, unknown>,
          errors: result.errors ?? [],
        })
        .where(eq(ingestRuns.id, id));
    },
  };
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
