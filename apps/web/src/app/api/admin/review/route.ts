import { NextResponse } from "next/server";
import { getPartById } from "@beyoracle/catalog";
import { getDb, matchReviewQueue } from "@beyoracle/db";
import { approveReviewQueueItem, rejectReviewQueueItem } from "@beyoracle/ingest";
import { isDbAvailable } from "@/lib/db-data";
import { desc, eq } from "drizzle-orm";

// v1: no auth — local dev tool only; protect with admin session before prod deploy

export async function GET() {
  if (!(await isDbAvailable())) {
    return NextResponse.json({ items: [], db: false });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(matchReviewQueue)
    .where(eq(matchReviewQueue.status, "pending"))
    .orderBy(desc(matchReviewQueue.createdAt));

  const items = rows.map((row) => {
    const part = row.suggestedPartId ? getPartById(row.suggestedPartId) : null;
    return {
      id: row.id,
      observationId: row.observationId,
      title: row.title,
      suggestedPartId: row.suggestedPartId,
      suggestedProductId: row.suggestedProductId,
      suggestedPartName: part?.nameEn ?? null,
      confidence: row.confidence,
      method: row.method,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ db: true, items });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { id?: string; action?: "approve" | "reject" };

  if (!body.id || !body.action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  if (!(await isDbAvailable())) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    if (body.action === "approve") {
      const result = await approveReviewQueueItem(body.id);
      return NextResponse.json({ ok: true, action: "approved", ...result });
    }

    await rejectReviewQueueItem(body.id);
    return NextResponse.json({ ok: true, action: "rejected" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Review action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
