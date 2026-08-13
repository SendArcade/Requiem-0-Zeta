import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = {
  id: string;
  jobName: string;
  sourceId: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  status: string;
  stats: Record<string, unknown>;
  errors: string[];
};

const { store, matchCond } = vi.hoisted(() => {
  const store: Row[] = [];
  function matchCond(
    cond: { type: string; col?: string; val?: unknown; conds?: unknown[] },
    row: Row
  ): boolean {
    if (cond.type === "and") {
      return (cond.conds as typeof cond[]).every((c) => matchCond(c, row));
    }
    const key = cond.col as keyof Row;
    if (cond.type === "eq") return row[key] === cond.val;
    if (cond.type === "lt") return (row[key] as Date) < (cond.val as Date);
    return true;
  }
  return { store, matchCond };
});

vi.mock("drizzle-orm", () => ({
  eq: (col: string, val: unknown) => ({ type: "eq", col, val }),
  lt: (col: string, val: unknown) => ({ type: "lt", col, val }),
  and: (...conds: unknown[]) => ({ type: "and", conds }),
  desc: (col: string) => ({ type: "desc", col }),
}));

vi.mock("@beyoracle/db", () => ({
  ingestRuns: {
    id: "id",
    jobName: "jobName",
    sourceId: "sourceId",
    startedAt: "startedAt",
    finishedAt: "finishedAt",
    status: "status",
    stats: "stats",
    errors: "errors",
  },
  getDb: () => ({
    insert: () => ({
      values: async (v: Row) => {
        store.push({ ...v, finishedAt: v.finishedAt ?? null });
      },
    }),
    update: () => ({
      set: (patch: Partial<Row>) => ({
        where: async (cond: { type: string; col?: string; val?: unknown; conds?: unknown[] }) => {
          for (const row of store) {
            if (matchCond(cond, row)) Object.assign(row, patch);
          }
        },
      }),
    }),
    select: (shape?: { id: string }) => ({
      from: () => ({
        where: async (cond: { type: string; col?: string; val?: unknown; conds?: unknown[] }) => {
          const matched = store.filter((r) => matchCond(cond, r));
          if (shape && "id" in shape) return matched.map((r) => ({ id: r.id }));
          return matched;
        },
        orderBy: () => ({
          limit: async () => store.slice(),
        }),
      }),
    }),
  }),
}));

import {
  DEFAULT_INGEST_RUN_STALE_MS,
  isRunningIngestRunStale,
  startIngestRun,
  sweepStaleIngestRuns,
} from "./runs.js";

describe("ingest_runs lifecycle", () => {
  beforeEach(() => {
    store.length = 0;
  });

  it("isRunningIngestRunStale matches PRODUCT_BACKFILL_STALE_MS idea", () => {
    const now = new Date("2026-08-14T00:00:00.000Z");
    const staleMs = 45 * 60 * 1000;
    expect(
      isRunningIngestRunStale(
        { status: "running", startedAt: new Date("2026-08-13T23:00:00.000Z") },
        staleMs,
        now
      )
    ).toBe(true);
    expect(
      isRunningIngestRunStale(
        { status: "running", startedAt: new Date("2026-08-13T23:30:00.000Z") },
        staleMs,
        now
      )
    ).toBe(false);
    expect(
      isRunningIngestRunStale(
        { status: "success", startedAt: new Date("2026-08-13T22:00:00.000Z") },
        staleMs,
        now
      )
    ).toBe(false);
    expect(DEFAULT_INGEST_RUN_STALE_MS).toBe(45 * 60 * 1000);
  });

  it("finish is idempotent so try/finally cannot overwrite success", async () => {
    const run = await startIngestRun({ jobName: "cron.tick" });
    expect(store[0]?.status).toBe("running");
    await run.finish({ status: "success", stats: { ok: true }, errors: [] });
    await run.finish({ status: "failed", errors: ["should not land"] });
    expect(store[0]?.status).toBe("success");
    expect(store[0]?.errors).toEqual([]);
    expect(store[0]?.finishedAt).toBeInstanceOf(Date);
  });

  it("finishes ingest_runs as failed when the job throws", async () => {
    const run = await startIngestRun({ jobName: "cron.tick" });
    try {
      throw new Error("boom");
    } catch (err) {
      await run.finish({
        status: "failed",
        errors: [(err as Error).message],
      });
    }
    expect(store[0]?.status).toBe("failed");
    expect(store[0]?.errors).toEqual(["boom"]);
    expect(store[0]?.finishedAt).toBeInstanceOf(Date);
  });

  it("sweepStaleIngestRuns marks expired running rows failed", async () => {
    const now = new Date("2026-08-14T00:00:00.000Z");
    store.push(
      {
        id: "stale",
        jobName: "cron.tick",
        sourceId: null,
        startedAt: new Date("2026-08-13T22:00:00.000Z"),
        finishedAt: null,
        status: "running",
        stats: {},
        errors: [],
      },
      {
        id: "fresh",
        jobName: "ingest.source",
        sourceId: "mercari_jp",
        startedAt: new Date("2026-08-13T23:50:00.000Z"),
        finishedAt: null,
        status: "running",
        stats: {},
        errors: [],
      },
      {
        id: "done",
        jobName: "cron.tick",
        sourceId: null,
        startedAt: new Date("2026-08-13T22:00:00.000Z"),
        finishedAt: new Date("2026-08-13T22:01:00.000Z"),
        status: "success",
        stats: {},
        errors: [],
      }
    );

    const n = await sweepStaleIngestRuns({ staleMs: 45 * 60 * 1000, now });
    expect(n).toBe(1);
    expect(store.find((r) => r.id === "stale")?.status).toBe("failed");
    expect(store.find((r) => r.id === "stale")?.errors[0]).toMatch(/stale:/);
    expect(store.find((r) => r.id === "fresh")?.status).toBe("running");
    expect(store.find((r) => r.id === "done")?.status).toBe("success");
  });

  it("does not sweep long-running product backfill jobs", async () => {
    const now = new Date("2026-08-14T00:00:00.000Z");
    store.push({
      id: "shard",
      jobName: "product.backfill.shard",
      sourceId: null,
      startedAt: new Date("2026-08-13T12:00:00.000Z"),
      finishedAt: null,
      status: "running",
      stats: {},
      errors: [],
    });
    const n = await sweepStaleIngestRuns({ staleMs: 45 * 60 * 1000, now });
    expect(n).toBe(0);
    expect(store.find((r) => r.id === "shard")?.status).toBe("running");
  });
});
