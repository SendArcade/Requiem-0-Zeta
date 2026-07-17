import { z } from "zod";
import { SOURCES } from "@beyoracle/shared";

export const cronTickPayload = z.object({
  tickId: z.string(),
  triggeredAt: z.string(),
});

export const ingestSourcePayload = z.object({
  sourceId: z.enum(SOURCES),
  queries: z.array(z.string()),
  limitPerQuery: z.number().int().positive().optional(),
  tickId: z.string().optional(),
});

export const oracleRecomputePayload = z.object({
  partIds: z.array(z.string()).min(1),
  reason: z.enum(["ingest", "manual", "backfill"]).default("ingest"),
});

export const alertsCheckPayload = z.object({
  tickId: z.string().optional(),
});

export const ingestBackfillLandedPayload = z.object({
  batchSize: z.number().int().positive().default(200),
  cursor: z.string().optional(),
});

export const productBackfillShardPayload = z.object({
  shardId: z.number().int().nonnegative(),
  shardCount: z.number().int().positive().max(10_000),
  generations: z
    .array(z.enum(["plastic", "metal", "burst", "x"]))
    .optional(),
  priorityOnly: z.boolean().optional(),
  maxQueries: z.number().int().positive().optional(),
  maxProducts: z.number().int().positive().optional(),
});

export type CronTickPayload = z.infer<typeof cronTickPayload>;
export type IngestSourcePayload = z.infer<typeof ingestSourcePayload>;
export type OracleRecomputePayload = z.infer<typeof oracleRecomputePayload>;
export type AlertsCheckPayload = z.infer<typeof alertsCheckPayload>;
export type IngestBackfillLandedPayload = z.infer<typeof ingestBackfillLandedPayload>;
export type ProductBackfillShardPayload = z.infer<typeof productBackfillShardPayload>;

export const JOB_SCHEMAS = {
  "cron.tick": cronTickPayload,
  "ingest.source": ingestSourcePayload,
  "oracle.recompute": oracleRecomputePayload,
  "alerts.check": alertsCheckPayload,
  "ingest.backfill-landed": ingestBackfillLandedPayload,
  "product.backfill.shard": productBackfillShardPayload,
  "poll-sources": z.object({}),
} as const;
