-- Product-level matches and oracle snapshots (whole-SKU vertical slice)
CREATE TABLE IF NOT EXISTS "product_matches" (
  "id" text PRIMARY KEY NOT NULL,
  "observation_id" text NOT NULL REFERENCES "observations"("id") ON DELETE cascade,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "confidence" real NOT NULL,
  "method" "match_method" NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "product_matches_product_id_idx" ON "product_matches" ("product_id");
CREATE INDEX IF NOT EXISTS "product_matches_observation_id_idx" ON "product_matches" ("observation_id");

CREATE TABLE IF NOT EXISTS "product_oracle_snapshots" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "sources_mask" integer NOT NULL,
  "value" real NOT NULL,
  "low" real NOT NULL,
  "high" real NOT NULL,
  "ci_low" real,
  "ci_high" real,
  "n_comps" integer NOT NULL,
  "as_of" timestamptz NOT NULL,
  "currency" text NOT NULL,
  "confidence" "oracle_confidence" NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "product_oracle_snapshots_product_id_idx" ON "product_oracle_snapshots" ("product_id");
CREATE UNIQUE INDEX IF NOT EXISTS "product_oracle_snapshots_product_mask_idx" ON "product_oracle_snapshots" ("product_id", "sources_mask");
