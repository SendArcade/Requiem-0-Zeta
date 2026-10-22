import { getDb } from "@beyoracle/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Readiness must test connectivity, not whether a seeded table happens to be empty. */
export async function GET() {
  if (process.env.DATA_SOURCE === "fixtures") return Response.json({ status: "ready", mode: "fixtures" }, { headers: { "Cache-Control": "no-store" } });
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ready", mode: "database" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
