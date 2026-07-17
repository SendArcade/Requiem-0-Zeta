/** Control-plane job names — War Machine-style typed catalog for BullMQ. */

export const CRON_TICK = "cron.tick" as const;
export const INGEST_SOURCE = "ingest.source" as const;
export const ORACLE_RECOMPUTE = "oracle.recompute" as const;
export const ALERTS_CHECK = "alerts.check" as const;
export const INGEST_BACKFILL_LANDED = "ingest.backfill-landed" as const;
/** One shard of parallel product backfill (fleet of workers). */
export const PRODUCT_BACKFILL_SHARD = "product.backfill.shard" as const;

/** @deprecated Use CRON_TICK → INGEST_SOURCE fan-out instead. */
export const POLL_SOURCES = "poll-sources" as const;

export const JOB_NAMES = [
  CRON_TICK,
  INGEST_SOURCE,
  ORACLE_RECOMPUTE,
  ALERTS_CHECK,
  INGEST_BACKFILL_LANDED,
  PRODUCT_BACKFILL_SHARD,
  POLL_SOURCES,
] as const;

export type JobName = (typeof JOB_NAMES)[number];

export const CONTROL_QUEUE = "beyoracle-control" as const;
