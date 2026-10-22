import Link from "next/link";
import { getPartById } from "@beyoracle/catalog";
import { getDb, watchlist, watchlistAlerts } from "@beyoracle/db";
import { getAssetData } from "@/lib/data";
import { isDbAvailable } from "@/lib/db-data";
import { getSessionId } from "@/lib/watchlist";
import { and, desc, eq } from "drizzle-orm";
import { WatchlistClient } from "@/components/WatchlistClient";

export default async function WatchlistPage() {
  const sessionId = await getSessionId();
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <p className="mt-4 text-[var(--muted)]">
          Watchlist and price-drop alerts require Postgres. Run{" "}
          <code className="text-[var(--accent)]">pnpm docker:up && pnpm db:migrate && pnpm db:seed</code>{" "}
          then refresh.
        </p>
      </div>
    );
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(watchlist)
    .where(eq(watchlist.sessionId, sessionId));

  const alerts = await db
    .select()
    .from(watchlistAlerts)
    .where(eq(watchlistAlerts.sessionId, sessionId))
    .orderBy(desc(watchlistAlerts.createdAt))
    .limit(20);

  const items = await Promise.all(
    rows.map(async (row) => {
      const part = getPartById(row.partId);
      const data = await getAssetData(row.partId);
      if (!part) return null;
      return {
        part,
        oracle: data?.oracle ?? null,
        baselineValue: row.baselineValue,
        alertThresholdPct: row.alertThresholdPct,
      };
    })
  );

  const alertItems = alerts.map((a) => {
    const part = getPartById(a.partId);
    return {
      id: a.id,
      partId: a.partId,
      partName: part?.nameEn ?? a.partId,
      previousValue: a.previousValue,
      newValue: a.newValue,
      dropPct: a.dropPct,
      thresholdPct: a.thresholdPct,
      read: a.read === 1,
      createdAt: a.createdAt.toISOString(),
    };
  });

  return (
    <WatchlistClient
      items={items.filter(Boolean) as NonNullable<(typeof items)[number]>[]}
      alerts={alertItems}
    />
  );
}
