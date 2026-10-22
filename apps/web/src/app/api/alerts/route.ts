import { readJsonObject, validId, withApiErrors } from "@/lib/api-input";
import { NextResponse } from "next/server";
import { getDb, watchlistAlerts } from "@beyoracle/db";
import { getSessionId } from "@/lib/watchlist";
import { isDbAvailable } from "@/lib/db-data";
import { and, desc, eq } from "drizzle-orm";

export const GET = withApiErrors(async () => {
  const sessionId = await getSessionId();
  if (!(await isDbAvailable())) {
    return NextResponse.json({ alerts: [] });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(watchlistAlerts)
    .where(eq(watchlistAlerts.sessionId, sessionId))
    .orderBy(desc(watchlistAlerts.createdAt))
    .limit(50);

  return NextResponse.json({
    alerts: rows.map((r) => ({
      id: r.id,
      partId: r.partId,
      previousValue: r.previousValue,
      newValue: r.newValue,
      dropPct: r.dropPct,
      thresholdPct: r.thresholdPct,
      read: r.read === 1,
      createdAt: r.createdAt.toISOString(),
    })),
    unread: rows.filter((r) => r.read === 0).length,
  });
});

export const PATCH = withApiErrors(async (req: Request) => {
  const body = await readJsonObject(req);
  if (body.markAllRead !== true && !validId(body.alertId)) return NextResponse.json({ error: "markAllRead or alertId required" }, { status: 400 });
  if (body.markAllRead != null && typeof body.markAllRead !== "boolean") return NextResponse.json({ error: "markAllRead must be boolean" }, { status: 400 });
  const sessionId = await getSessionId();

  if (!(await isDbAvailable())) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const db = getDb();

  if (body.markAllRead) {
    await db
      .update(watchlistAlerts)
      .set({ read: 1 })
      .where(and(eq(watchlistAlerts.sessionId, sessionId), eq(watchlistAlerts.read, 0)));
  } else if (validId(body.alertId)) {
    await db
      .update(watchlistAlerts)
      .set({ read: 1 })
      .where(
        and(
          eq(watchlistAlerts.sessionId, sessionId),
          eq(watchlistAlerts.id, body.alertId)
        )
      );
  }

  return NextResponse.json({ ok: true });
});
