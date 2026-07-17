ALTER TABLE "watchlist" ADD COLUMN IF NOT EXISTS "baseline_value" real;
ALTER TABLE "watchlist" ADD COLUMN IF NOT EXISTS "last_alert_at" timestamp with time zone;
ALTER TABLE "watchlist" ALTER COLUMN "alert_threshold_pct" SET DEFAULT 10;
UPDATE "watchlist" SET "alert_threshold_pct" = 10 WHERE "alert_threshold_pct" IS NULL;
ALTER TABLE "watchlist" ALTER COLUMN "alert_threshold_pct" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "watchlist_alerts" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL,
  "part_id" text NOT NULL REFERENCES "parts"("id") ON DELETE cascade,
  "previous_value" real NOT NULL,
  "new_value" real NOT NULL,
  "drop_pct" real NOT NULL,
  "threshold_pct" real NOT NULL,
  "read" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "watchlist_alerts_session_idx" ON "watchlist_alerts" ("session_id");
CREATE INDEX IF NOT EXISTS "watchlist_alerts_session_read_idx" ON "watchlist_alerts" ("session_id", "read");
