import { describe, expect, it } from "vitest";
import {
  bullmqWorkerLockOpts,
  DEFAULT_BULLMQ_LOCK_DURATION_MS,
  DEFAULT_BULLMQ_LOCK_RENEW_MS,
} from "./config.js";

describe("bullmqWorkerLockOpts", () => {
  it("defaults above the 10m lock that stalled shard jobs", () => {
    const opts = bullmqWorkerLockOpts({});
    expect(opts.lockDuration).toBe(DEFAULT_BULLMQ_LOCK_DURATION_MS);
    expect(opts.lockDuration).toBeGreaterThan(10 * 60 * 1000);
    expect(opts.lockRenewTime).toBe(DEFAULT_BULLMQ_LOCK_RENEW_MS);
    expect(opts.lockRenewTime).toBeLessThanOrEqual(opts.lockDuration / 2);
  });

  it("falls back when env is NaN or non-positive", () => {
    const opts = bullmqWorkerLockOpts({
      BULLMQ_LOCK_DURATION_MS: "abc",
      BULLMQ_LOCK_RENEW_MS: "0",
    });
    expect(opts.lockDuration).toBe(DEFAULT_BULLMQ_LOCK_DURATION_MS);
    expect(opts.lockRenewTime).toBeGreaterThan(0);
    expect(opts.lockRenewTime).toBeLessThan(opts.lockDuration);
  });
});
