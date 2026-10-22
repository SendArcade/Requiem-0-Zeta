/**
 * Oracle recompute scheduling — inline by default, defer via BullMQ when
 * DEFER_ORACLE_RECOMPUTE=1 and worker registers an enqueuer at boot.
 */

export type OracleRecomputeEnqueuer = (
  partIds: string[],
  reason: "ingest" | "manual" | "backfill",
  productIds?: string[]
) => Promise<void>;

let enqueuer: OracleRecomputeEnqueuer | null = null;

/** Worker calls this at startup to wire oracle.recompute jobs. */
export function registerOracleRecomputeEnqueuer(fn: OracleRecomputeEnqueuer): void {
  enqueuer = fn;
}

export function deferOracleRecomputeEnabled(): boolean {
  return process.env.DEFER_ORACLE_RECOMPUTE === "1";
}

export function getOracleRecomputeEnqueuer(): OracleRecomputeEnqueuer | null {
  return enqueuer;
}
