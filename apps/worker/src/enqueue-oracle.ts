import type { Queue } from "bullmq";
import {
  ORACLE_RECOMPUTE,
  bullmqOptsForJob,
  parseJobPayload,
  type OracleRecomputePayload,
} from "@beyoracle/jobs";

/** Enqueue oracle.recompute — use from worker boot or manual ops. */
export async function enqueueOracleRecompute(
  queue: Queue,
  partIds: string[],
  reason: OracleRecomputePayload["reason"] = "ingest",
  productIds: string[] = []
): Promise<void> {
  const parts = [...new Set(partIds)];
  const products = [...new Set(productIds)];
  if (parts.length === 0 && products.length === 0) return;

  const payload = parseJobPayload(ORACLE_RECOMPUTE, {
    partIds: parts,
    productIds: products,
    reason,
  });
  const idKey = [...parts, ...products].sort().join(",");
  await queue.add(ORACLE_RECOMPUTE, payload, {
    jobId: `oracle-${reason}-${idKey}`.replace(/:/g, "-").slice(0, 200),
    ...bullmqOptsForJob(ORACLE_RECOMPUTE),
  });
}
