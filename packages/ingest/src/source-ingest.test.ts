import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const finishMock = vi.fn();
const startIngestRunMock = vi.fn();
const persistIngestBatchMock = vi.fn();
const persistBundleObservationsMock = vi.fn();
const searchMock = vi.fn();

vi.mock("./runs.js", () => ({
  startIngestRun: (opts: unknown) => startIngestRunMock(opts),
}));

vi.mock("./persist.js", () => ({
  persistIngestBatch: (...args: unknown[]) => persistIngestBatchMock(...args),
  persistBundleObservations: (...args: unknown[]) => persistBundleObservationsMock(...args),
}));

vi.mock("./pipeline.js", () => ({
  getSources: () => [
    {
      id: "mercari_jp",
      search: (...args: unknown[]) => searchMock(...args),
      normalize: (r: { title: string }) => ({
        source: "mercari_jp",
        status: "sold",
        title: r.title,
        currency: "JPY",
      }),
    },
  ],
}));

vi.mock("./match-ingest.js", () => ({
  resolveIngestMatch: () => ({ partId: "x-bx-01-blade", confidence: 1 }),
}));

vi.mock("@beyoracle/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@beyoracle/shared")>();
  return {
    ...actual,
    looksLikeBeybladeListing: () => true,
    classifyListingShape: () => "starter",
    isIngestEligible: () => true,
  };
});

import { runSourceIngest } from "./source-ingest.js";

describe("runSourceIngest ingest_runs try/finally", () => {
  const prevMercari = process.env.MERCARI_API_ENABLED;

  beforeEach(() => {
    process.env.MERCARI_API_ENABLED = "1";
    finishMock.mockReset();
    startIngestRunMock.mockReset();
    startIngestRunMock.mockResolvedValue({
      id: "run-src",
      pulse: vi.fn(),
      finish: finishMock,
    });
    persistIngestBatchMock.mockReset();
    persistIngestBatchMock.mockResolvedValue({
      inserted: 0,
      updated: 0,
      matched: 0,
      partsTouched: new Set(),
      productsTouched: new Set(),
    });
    persistBundleObservationsMock.mockReset();
    searchMock.mockReset();
    searchMock.mockResolvedValue([]);
  });

  afterEach(() => {
    if (prevMercari == null) delete process.env.MERCARI_API_ENABLED;
    else process.env.MERCARI_API_ENABLED = prevMercari;
  });

  it("finishes ingest_runs as failed when persist throws", async () => {
    persistIngestBatchMock.mockRejectedValue(new Error("db down"));
    const report = await runSourceIngest({
      sourceId: "mercari_jp",
      queries: ["BX-01"],
    });
    expect(report.errors.some((e) => e.includes("db down"))).toBe(true);
    expect(finishMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        errors: expect.arrayContaining([expect.stringContaining("db down")]),
      })
    );
  });

  it("finishes ingest_runs as failed when search throws", async () => {
    searchMock.mockRejectedValue(new Error("network"));
    const report = await runSourceIngest({
      sourceId: "mercari_jp",
      queries: ["BX-01"],
    });
    expect(report.errors.some((e) => e.includes("network"))).toBe(true);
    expect(finishMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
      })
    );
  });

  it("finishes ingest_runs as success when the corridor is clean", async () => {
    const report = await runSourceIngest({
      sourceId: "mercari_jp",
      queries: ["BX-01"],
    });
    expect(report.errors).toEqual([]);
    expect(finishMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        errors: [],
      })
    );
  });
});
