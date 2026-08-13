import { describe, expect, it } from "vitest";
import { parseProductBackfillGenerations } from "./backfill-generations.js";
import { bullmqWorkerLockOpts, DEFAULT_BULLMQ_LOCK_DURATION_MS } from "@beyoracle/jobs";

describe("parseProductBackfillGenerations", () => {
  it("defaults the next fleet pass to burst only", () => {
    expect(parseProductBackfillGenerations(undefined)).toEqual(["burst"]);
    expect(parseProductBackfillGenerations("")).toEqual(["burst"]);
    expect(parseProductBackfillGenerations("burst")).toEqual(["burst"]);
    expect(parseProductBackfillGenerations("nope")).toEqual(["burst"]);
  });

  it("accepts all / * for the full catalog without mixing sealed FMV work", () => {
    expect(parseProductBackfillGenerations("all")).toBeUndefined();
    expect(parseProductBackfillGenerations("*")).toBeUndefined();
    expect(parseProductBackfillGenerations("plastic,metal,burst,x")).toEqual([
      "plastic",
      "metal",
      "burst",
      "x",
    ]);
  });
});

describe("bullmqWorkerLockOpts", () => {
  it("defaults above the 10m lock that stalled shard jobs", () => {
    const opts = bullmqWorkerLockOpts({});
    expect(opts.lockDuration).toBe(DEFAULT_BULLMQ_LOCK_DURATION_MS);
    expect(opts.lockDuration).toBeGreaterThan(10 * 60 * 1000);
    expect(opts.lockRenewTime).toBeGreaterThan(0);
    expect(opts.lockRenewTime).toBeLessThanOrEqual(opts.lockDuration / 2);
  });

  it("honors BULLMQ_LOCK_DURATION_MS and BULLMQ_LOCK_RENEW_MS", () => {
    const opts = bullmqWorkerLockOpts({
      BULLMQ_LOCK_DURATION_MS: "3600000",
      BULLMQ_LOCK_RENEW_MS: "15000",
    });
    expect(opts.lockDuration).toBe(3_600_000);
    expect(opts.lockRenewTime).toBe(15_000);
  });

  it("falls back when lock env is invalid and keeps renew below duration", () => {
    const bad = bullmqWorkerLockOpts({
      BULLMQ_LOCK_DURATION_MS: "nope",
      BULLMQ_LOCK_RENEW_MS: "-1",
    });
    expect(bad.lockDuration).toBe(DEFAULT_BULLMQ_LOCK_DURATION_MS);
    expect(bad.lockRenewTime).toBeGreaterThan(0);
    expect(bad.lockRenewTime).toBeLessThan(bad.lockDuration);

    const tight = bullmqWorkerLockOpts({
      BULLMQ_LOCK_DURATION_MS: "8000",
      BULLMQ_LOCK_RENEW_MS: "8000",
    });
    expect(tight.lockDuration).toBe(8_000);
    expect(tight.lockRenewTime).toBeLessThan(tight.lockDuration);
  });
});
