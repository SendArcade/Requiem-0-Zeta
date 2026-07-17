-- Product-level SSE replay (nullable part_id, optional product_id)
ALTER TABLE "sale_events" ALTER COLUMN "part_id" DROP NOT NULL;

ALTER TABLE "sale_events" ADD COLUMN IF NOT EXISTS "product_id" text;

DO $$ BEGIN
  ALTER TABLE "sale_events" ADD CONSTRAINT "sale_events_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "sale_events_product_id_idx" ON "sale_events" ("product_id");
