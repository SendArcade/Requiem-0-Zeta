-- Beyoracle initial schema
CREATE TYPE "generation" AS ENUM('plastic', 'metal', 'burst', 'x');
CREATE TYPE "source" AS ENUM('mercari_jp', 'shopee_tw');
CREATE TYPE "condition" AS ENUM('sealed', 'like_new', 'used', 'unknown');
CREATE TYPE "observation_status" AS ENUM('listing', 'sold');
CREATE TYPE "match_method" AS ENUM('product_code', 'alias_exact', 'alias_fuzzy', 'manual');
CREATE TYPE "locale" AS ENUM('en', 'ja', 'zh');
CREATE TYPE "oracle_confidence" AS ENUM('high', 'medium', 'low');

CREATE TABLE IF NOT EXISTS "parts" (
  "id" text PRIMARY KEY NOT NULL,
  "generation" "generation" NOT NULL,
  "part_type" text NOT NULL,
  "name_en" text NOT NULL,
  "name_jp" text,
  "name_zh" text,
  "product_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "attrs" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "parts_generation_idx" ON "parts" ("generation");

CREATE TABLE IF NOT EXISTS "aliases" (
  "id" text PRIMARY KEY NOT NULL,
  "part_id" text NOT NULL REFERENCES "parts"("id") ON DELETE cascade,
  "locale" "locale" NOT NULL,
  "text" text NOT NULL,
  "source" text DEFAULT 'catalog' NOT NULL
);

CREATE INDEX IF NOT EXISTS "aliases_part_id_idx" ON "aliases" ("part_id");
CREATE INDEX IF NOT EXISTS "aliases_text_idx" ON "aliases" ("text");

CREATE TABLE IF NOT EXISTS "observations" (
  "id" text PRIMARY KEY NOT NULL,
  "source" "source" NOT NULL,
  "external_id" text NOT NULL,
  "title" text NOT NULL,
  "price" real NOT NULL,
  "currency" text NOT NULL,
  "status" "observation_status" NOT NULL,
  "condition" "condition" DEFAULT 'unknown' NOT NULL,
  "url" text NOT NULL,
  "observed_at" timestamp with time zone NOT NULL,
  "raw_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "observations_source_external_idx" ON "observations" ("source","external_id");
CREATE INDEX IF NOT EXISTS "observations_observed_at_idx" ON "observations" ("observed_at");

CREATE TABLE IF NOT EXISTS "matches" (
  "id" text PRIMARY KEY NOT NULL,
  "observation_id" text NOT NULL REFERENCES "observations"("id") ON DELETE cascade,
  "part_id" text NOT NULL REFERENCES "parts"("id") ON DELETE cascade,
  "confidence" real NOT NULL,
  "method" "match_method" NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "matches_part_id_idx" ON "matches" ("part_id");
CREATE INDEX IF NOT EXISTS "matches_observation_id_idx" ON "matches" ("observation_id");

CREATE TABLE IF NOT EXISTS "oracle_snapshots" (
  "id" text PRIMARY KEY NOT NULL,
  "asset_id" text NOT NULL REFERENCES "parts"("id") ON DELETE cascade,
  "sources_mask" integer NOT NULL,
  "value" real NOT NULL,
  "low" real NOT NULL,
  "high" real NOT NULL,
  "n_comps" integer NOT NULL,
  "as_of" timestamp with time zone NOT NULL,
  "currency" text NOT NULL,
  "confidence" "oracle_confidence" NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "oracle_snapshots_asset_id_idx" ON "oracle_snapshots" ("asset_id");
CREATE UNIQUE INDEX IF NOT EXISTS "oracle_snapshots_asset_mask_idx" ON "oracle_snapshots" ("asset_id","sources_mask");

CREATE TABLE IF NOT EXISTS "watchlist" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL,
  "part_id" text NOT NULL REFERENCES "parts"("id") ON DELETE cascade,
  "alert_threshold_pct" real,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "watchlist_session_part_idx" ON "watchlist" ("session_id","part_id");
CREATE INDEX IF NOT EXISTS "watchlist_session_id_idx" ON "watchlist" ("session_id");
