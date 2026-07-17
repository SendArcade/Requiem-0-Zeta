-- Product-level catalog (whole SKUs: starters, sealed boxes, complete beys)
CREATE TYPE "sku_type" AS ENUM('sealed', 'starter', 'complete_loose', 'complete_sealed');

CREATE TABLE IF NOT EXISTS "products" (
  "id" text PRIMARY KEY NOT NULL,
  "generation" "generation" NOT NULL,
  "sku_type" "sku_type" NOT NULL,
  "name_en" text NOT NULL,
  "name_jp" text,
  "product_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "attrs" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "products_generation_idx" ON "products" ("generation");
CREATE INDEX IF NOT EXISTS "products_sku_type_idx" ON "products" ("sku_type");

CREATE TABLE IF NOT EXISTS "product_parts" (
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "part_id" text NOT NULL REFERENCES "parts"("id") ON DELETE cascade,
  PRIMARY KEY ("product_id", "part_id")
);

CREATE INDEX IF NOT EXISTS "product_parts_part_id_idx" ON "product_parts" ("part_id");
