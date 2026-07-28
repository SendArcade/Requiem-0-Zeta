import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { syncCatalogProducts } from "@beyoracle/catalog";
import { getDb, closeDb, parts } from "@beyoracle/db";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const migrationsFolder = join(repoRoot, "packages", "db", "drizzle");

/** Idempotent migrate + seed when DB is empty (Railway private network). */
export async function bootstrapDatabaseIfNeeded(): Promise<void> {
  const db = getDb();
  try {
    console.log("[bootstrap] running migrations…");
    await migrate(db, { migrationsFolder });
    const synced = await syncCatalogProducts();
    if (synced.inserted > 0) {
      console.log(`[bootstrap] synced ${synced.inserted} catalog products into DB`);
    }
    const rows = await db.select({ id: parts.id }).from(parts).limit(1);
    if (rows.length > 0) {
      console.log("[bootstrap] catalog already seeded — skip");
      return;
    }
    console.log("[bootstrap] empty DB — seeding catalog + fixtures…");
    const r = spawnSync("pnpm", ["db:seed"], {
      cwd: repoRoot,
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    if (r.status !== 0) {
      throw new Error(`db:seed exited with ${r.status ?? "unknown"}`);
    }
    console.log("[bootstrap] seed complete");
  } finally {
    await closeDb();
  }
}
