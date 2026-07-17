-- Bundle flag on observations (ingest audit + future bundle analytics)
ALTER TABLE "observations" ADD COLUMN IF NOT EXISTS "is_bundle" boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "observations_is_bundle_idx" ON "observations" ("is_bundle");

-- Minimal SSE replay buffer — last N sale events survive Redis pub/sub gaps
CREATE TABLE IF NOT EXISTS "sale_events" (
  "id" text PRIMARY KEY,
  "observation_id" text NOT NULL,
  "part_id" text NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "sale_events_observation_id_idx" ON "sale_events" ("observation_id");
CREATE INDEX IF NOT EXISTS "sale_events_created_at_idx" ON "sale_events" ("created_at");
