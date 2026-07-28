import { randomUUID } from "node:crypto";
import { getPartById } from "@beyoracle/catalog";
import { getDb, oracleSnapshots, watchlist, watchlistAlerts } from "@beyoracle/db";
import { publishEvent, type AlertEvent } from "@beyoracle/events";
import { allSourcesMask } from "@beyoracle/shared";
import { and, eq } from "drizzle-orm";

export interface AlertCheckReport {
  checked: number;
  alertsFired: number;
}

export function dropPct(baseline: number, current: number): number {
  if (baseline <= 0) return 0;
  return ((baseline - current) / baseline) * 100;
}

export async function checkWatchlistAlerts(): Promise<AlertCheckReport> {
  const db = getDb();
  const rows = await db.select().from(watchlist);

  const report: AlertCheckReport = { checked: rows.length, alertsFired: 0 };

  for (const row of rows) {
    if (row.baselineValue == null || row.baselineValue <= 0) continue;

    const [snap] = await db
      .select()
      .from(oracleSnapshots)
      .where(
        and(
          eq(oracleSnapshots.assetId, row.partId),
          eq(oracleSnapshots.sourcesMask, allSourcesMask())
        )
      )
      .limit(1);

    if (!snap) continue;

    const pct = dropPct(row.baselineValue, snap.value);
    const threshold = row.alertThresholdPct ?? 10;

    if (pct < threshold) continue;

    // Cooldown: skip if we alerted in the last 6 hours for this row
    if (row.lastAlertAt) {
      const hoursSince =
        (Date.now() - row.lastAlertAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 6) continue;
    }

    const part = getPartById(row.partId);
    const alertId = randomUUID();

    await db.insert(watchlistAlerts).values({
      id: alertId,
      sessionId: row.sessionId,
      partId: row.partId,
      previousValue: row.baselineValue,
      newValue: snap.value,
      dropPct: pct,
      thresholdPct: threshold,
      read: 0,
    });

    await db
      .update(watchlist)
      .set({ lastAlertAt: new Date() })
      .where(eq(watchlist.id, row.id));

    const event: AlertEvent = {
      type: "alert",
      alertId,
      sessionId: row.sessionId,
      partId: row.partId,
      partName: part?.nameEn ?? row.partId,
      previousValue: row.baselineValue,
      newValue: snap.value,
      dropPct: pct,
      thresholdPct: threshold,
    };

    await publishEvent(event);
    report.alertsFired++;
  }

  return report;
}
