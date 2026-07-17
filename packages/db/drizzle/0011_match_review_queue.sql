-- Human review queue for medium-confidence matches (0.60–0.90)
CREATE TYPE "match_review_status" AS ENUM('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS "match_review_queue" (
  "id" text PRIMARY KEY NOT NULL,
  "observation_id" text NOT NULL REFERENCES "observations"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "suggested_part_id" text REFERENCES "parts"("id") ON DELETE set null,
  "suggested_product_id" text REFERENCES "products"("id") ON DELETE set null,
  "confidence" real NOT NULL,
  "method" "match_method" NOT NULL,
  "status" "match_review_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "match_review_queue_status_idx" ON "match_review_queue" ("status");
CREATE INDEX IF NOT EXISTS "match_review_queue_observation_id_idx" ON "match_review_queue" ("observation_id");
