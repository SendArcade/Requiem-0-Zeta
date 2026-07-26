import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getPartById } from "@beyoracle/catalog";
import { getDb, watchlist } from "@beyoracle/db";
import { getAssetDataFromDb, isDbAvailable } from "@/lib/db-data";
import { getSessionId } from "@/lib/watchlist";
import { and, eq } from "drizzle-orm";

const DEFAULT_THRESHOLD = 10;

async function listFromDb(sessionId: string) {
  const db = getDb();
  return db.select().from(watchlist).where(eq(watchlist.sessionId, sessionId));
}

export async function GET() {
  const sessionId = await getSessionId();
  if (!(await isDbAvailable())) {
    return NextResponse.json({ partIds: [], alerts: [], db: false });
  }

  const rows = await listFromDb(sessionId);
  return NextResponse.json({
    db: true,
    partIds: rows.map((r) => r.partId),
    items: rows.map((r) => ({
      partId: r.partId,
      baselineValue: r.baselineValue,
      alertThresholdPct: r.alertThresholdPct,
    })),
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    partId?: string;
    alertThresholdPct?: number;
  };
  if (!body.partId || !getPartById(body.partId)) {
    return NextResponse.json({ error: "Invalid partId" }, { status: 400 });
  }

  const sessionId = await getSessionId();
  const threshold = body.alertThresholdPct ?? DEFAULT_THRESHOLD;

  if (!(await isDbAvailable())) {
    return NextResponse.json(
      { error: "Database required for watchlist — run pnpm db:seed" },
      { status: 503 }
    );
  }

  const data = await getAssetDataFromDb(body.partId);
  const baseline = data?.oracle?.value ?? null;

  const db = getDb();
  await db
    .insert(watchlist)
    .values({
      id: randomUUID(),
      sessionId,
      partId: body.partId,
      baselineValue: baseline,
      alertThresholdPct: threshold,
    })
    .onConflictDoUpdate({
      target: [watchlist.sessionId, watchlist.partId],
      set: {
        alertThresholdPct: threshold,
        baselineValue: baseline ?? undefined,
      },
    });

  const rows = await listFromDb(sessionId);
  return NextResponse.json({ partIds: rows.map((r) => r.partId) });
}

export async function DELETE(req: Request) {
  const body = (await req.json()) as { partId?: string };
  if (!body.partId) {
    return NextResponse.json({ error: "partId required" }, { status: 400 });
  }

  const sessionId = await getSessionId();
  if (!(await isDbAvailable())) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const db = getDb();
  await db
    .delete(watchlist)
    .where(and(eq(watchlist.sessionId, sessionId), eq(watchlist.partId, body.partId)));

  const rows = await listFromDb(sessionId);
  return NextResponse.json({ partIds: rows.map((r) => r.partId) });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as {
    partId?: string;
    alertThresholdPct?: number;
    resetBaseline?: boolean;
  };

  if (!body.partId) {
    return NextResponse.json({ error: "partId required" }, { status: 400 });
  }

  const sessionId = await getSessionId();
  if (!(await isDbAvailable())) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const db = getDb();
  const updates: Partial<{
    alertThresholdPct: number;
    baselineValue: number | null;
    lastAlertAt: null;
  }> = {};

  if (body.alertThresholdPct != null) {
    updates.alertThresholdPct = body.alertThresholdPct;
  }

  if (body.resetBaseline) {
    const data = await getAssetDataFromDb(body.partId);
    updates.baselineValue = data?.oracle?.value ?? null;
    updates.lastAlertAt = null;
  }

  await db
    .update(watchlist)
    .set(updates)
    .where(and(eq(watchlist.sessionId, sessionId), eq(watchlist.partId, body.partId)));

  const rows = await listFromDb(sessionId);
  return NextResponse.json({ partIds: rows.map((r) => r.partId) });
}
