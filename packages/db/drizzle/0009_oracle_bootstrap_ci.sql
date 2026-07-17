ALTER TABLE "oracle_snapshots" ADD COLUMN IF NOT EXISTS "ci_low" real;
ALTER TABLE "oracle_snapshots" ADD COLUMN IF NOT EXISTS "ci_high" real;
