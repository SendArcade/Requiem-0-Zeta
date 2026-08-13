import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Queue } from "bullmq";
import { ALERTS_CHECK, INGEST_SOURCE, PRODUCT_BACKFILL_SHARD } from "@beyoracle/jobs";

const {
  finishMock,
  startIngestRunMock,
  buildIngestQueryPlanMock,
  listEnabledSourcesMock,
  isBackfillInFlightMock,
  sweepStaleIngestRunsMock,
} = vi.hoisted(() => ({
  finishMock: vi.fn(),
  startIngestRunMock: vi.fn(),
  buildIngestQueryPlanMock: vi.fn(),
  listEnabledSourcesMock: vi.fn(),
  isBackfillInFlightMock: vi.fn(),
  sweepStaleIngestRunsMock: vi.fn(),
}));

vi.mock("@beyoracle/ingest", () => ({
  buildIngestQueryPlan: () => buildIngestQueryPlanMock(),
  isBackfillInFlight: () => isBackfillInFlightMock(),
  listEnabledSources: () => listEnabledSourcesMock(),
  startIngestRun: (opts: unknown) => startIngestRunMock(opts),
  sweepStaleIngestRuns: (opts?: unknown) => sweepStaleIngestRunsMock(opts),
}));

import {
  CRON_REPEATABLE_JOB_ID,
  dispatchCronTick,
  ingestSourceJobId,
  newTickId,
  syncScheduledCronTick,
} from "./dispatch.js";

function mockQueue() {
  const added: Array<{ name: string; data: Record<string, unknown>; opts: Record<string, unknown> }> =
    [];
  const removedKeys: string[] = [];
  const repeatables: Array<{ key: string; id: string; name: string }> = [];
  const queue = {
    add: vi.fn(async (name: string, data: Record<string, unknown>, opts: Record<string, unknown>) => {
      added.push({ name, data, opts });
      return { id: opts.jobId };
    }),
    getRepeatableJobs: vi.fn(async () => repeatables),
    removeRepeatableByKey: vi.fn(async (key: string) => {
      removedKeys.push(key);
      return true;
    }),
    removeRepeatable: vi.fn(async () => false),
    getDelayed: vi.fn(async () => []),
  };
  return { queue: queue as unknown as Queue, added, removedKeys, repeatables, raw: queue };
}

describe("cron tickId + fan-out", () => {
  beforeEach(() => {
    finishMock.mockReset();
    startIngestRunMock.mockReset();
    startIngestRunMock.mockImplementation(async () => ({
      id: "run-1",
      pulse: vi.fn(),
      finish: finishMock,
    }));
    buildIngestQueryPlanMock.mockReset();
    buildIngestQueryPlanMock.mockReturnValue(["BX-01"]);
    listEnabledSourcesMock.mockReset();
    listEnabledSourcesMock.mockReturnValue(["mercari_jp", "yahoo_auctions_jp"]);
    isBackfillInFlightMock.mockReset();
    isBackfillInFlightMock.mockReturnValue(false);
    sweepStaleIngestRunsMock.mockReset();
    sweepStaleIngestRunsMock.mockResolvedValue(0);
  });

  it("generates a unique tickId per fire so ingest jobIds never collide", async () => {
    const { queue, added } = mockQueue();
    const frozen = {
      tickId: "2026-08-05T00-00-00-000Z",
      triggeredAt: "2026-08-05T00:00:00.000Z",
    };

    const a = await dispatchCronTick(queue, frozen);
    const b = await dispatchCronTick(queue, frozen);

    expect(a.tickId).not.toBe(b.tickId);
    expect(a.tickId).not.toBe(frozen.tickId);
    expect(b.tickId).not.toBe(frozen.tickId);

    const jobIds = added.map((j) => String(j.opts.jobId));
    expect(new Set(jobIds).size).toBe(jobIds.length);
    expect(jobIds.some((id) => id.includes(frozen.tickId))).toBe(false);

    const ingestIds = added
      .filter((j) => j.name === INGEST_SOURCE)
      .map((j) => String(j.opts.jobId));
    expect(ingestIds).toEqual([
      ingestSourceJobId("mercari_jp", a.tickId),
      ingestSourceJobId("yahoo_auctions_jp", a.tickId),
      ingestSourceJobId("mercari_jp", b.tickId),
      ingestSourceJobId("yahoo_auctions_jp", b.tickId),
    ]);
  });

  it("does not enqueue catalog, sealed FMV, or product.backfill jobs", async () => {
    const { queue, added } = mockQueue();
    await dispatchCronTick(queue);
    const names = added.map((j) => j.name);
    expect(names.every((n) => n === INGEST_SOURCE || n === ALERTS_CHECK)).toBe(true);
    expect(names).not.toContain(PRODUCT_BACKFILL_SHARD);
    expect(names.some((n) => n.includes("catalog") || n.includes("fmv"))).toBe(false);
  });

  it("finishes ingest_runs as failed when dispatch throws", async () => {
    const { queue } = mockQueue();
    buildIngestQueryPlanMock.mockImplementation(() => {
      throw new Error("plan exploded");
    });
    await expect(dispatchCronTick(queue)).rejects.toThrow("plan exploded");
    expect(finishMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        errors: ["plan exploded"],
      })
    );
  });

  it("newTickId is unique across rapid calls", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newTickId()));
    expect(ids.size).toBe(50);
  });
});

describe("syncScheduledCronTick", () => {
  it("removes scheduled-cron-tick even when pause is on", async () => {
    const { queue, removedKeys, repeatables, raw } = mockQueue();
    repeatables.push({
      key: "cron.tick:scheduled-cron-tick:::900000",
      id: CRON_REPEATABLE_JOB_ID,
      name: "cron.tick",
    });
    const result = await syncScheduledCronTick(queue, { pause: true, intervalMs: 900_000 });
    expect(removedKeys).toEqual(["cron.tick:scheduled-cron-tick:::900000"]);
    expect(result).toEqual({ removed: 1, added: false });
    expect(raw.add).not.toHaveBeenCalled();
  });

  it("replaces the frozen repeatable without baking tickId into the payload", async () => {
    const { queue, added, repeatables } = mockQueue();
    repeatables.push({
      key: "cron.tick:scheduled-cron-tick:::900000",
      id: CRON_REPEATABLE_JOB_ID,
      name: "cron.tick",
    });
    const result = await syncScheduledCronTick(queue, { pause: false, intervalMs: 900_000 });
    expect(result.added).toBe(true);
    expect(added).toHaveLength(1);
    expect(added[0]?.opts.jobId).toBe(CRON_REPEATABLE_JOB_ID);
    expect(added[0]?.opts.repeat).toEqual({ every: 900_000 });
    expect(added[0]?.data.tickId).toBeUndefined();
  });
});
