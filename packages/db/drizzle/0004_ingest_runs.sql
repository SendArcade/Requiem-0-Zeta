-- Ingest run observability (War Machine service_heartbeats pattern)
CREATE TABLE IF NOT EXISTS "ingest_runs" (
  "id" text PRIMARY KEY,
  "job_name" text NOT NULL,
  "source_id" text,
  "started_at" timestamptz NOT NULL,
  "finished_at" timestamptz,
  "status" text NOT NULL,
  "stats" jsonb NOT NULL DEFAULT '{}',
  "errors" jsonb NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS "ingest_runs_started_at_idx" ON "ingest_runs" ("started_at");
CREATE INDEX IF NOT EXISTS "ingest_runs_job_name_idx" ON "ingest_runs" ("job_name");
