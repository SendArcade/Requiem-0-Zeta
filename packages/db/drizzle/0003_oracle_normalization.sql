-- Layer 0: immutable landed price + FX at time of sale
ALTER TABLE "observations" ADD COLUMN IF NOT EXISTS "landed_jpy" real;
ALTER TABLE "observations" ADD COLUMN IF NOT EXISTS "fx_rate_at_sale" real;
ALTER TABLE "observations" ADD COLUMN IF NOT EXISTS "shipping_jpy" real;
