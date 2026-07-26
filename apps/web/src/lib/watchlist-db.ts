import { getDb, watchlist } from "@beyoracle/db";
import { eq } from "drizzle-orm";
import { isDbAvailable } from "./db-data";
import { getSessionId } from "./watchlist";

export async function getWatchlistPartIds(): Promise<string[]> {
  if (!(await isDbAvailable())) return [];
  const sessionId = await getSessionId();
  const db = getDb();
  const rows = await db
    .select({ partId: watchlist.partId })
    .from(watchlist)
    .where(eq(watchlist.sessionId, sessionId));
  return rows.map((r) => r.partId);
}

export async function isOnWatchlist(partId: string): Promise<boolean> {
  const ids = await getWatchlistPartIds();
  return ids.includes(partId);
}
