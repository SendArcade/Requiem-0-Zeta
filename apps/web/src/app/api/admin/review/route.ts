import { NextResponse } from "next/server";
import { getPartById } from "@beyoracle/catalog";
import { getDb, matchReviewQueue } from "@beyoracle/db";
import { approveReviewQueueItem, rejectReviewQueueItem } from "@beyoracle/pricing-service";
import { isDbAvailable } from "@/lib/db-data";
import { desc, eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/admin-auth";
import { readJsonObject, validId, withApiErrors } from "@/lib/api-input";

export const GET = withApiErrors(async (req: Request) => {
  const denied = requireAdmin(req);
  if (denied) return denied;
  if (!(await isDbAvailable())) {
    return NextResponse.json({ items: [], db: false });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(matchReviewQueue)
    .where(eq(matchReviewQueue.status, "pending"))
    .orderBy(desc(matchReviewQueue.createdAt))
    .limit(100);

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
});

export const POST = withApiErrors(async (req: Request) => {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await readJsonObject(req);

  if (!validId(body.id) || (body.action !== "approve" && body.action !== "reject")) {
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
    console.error("[admin] review failed", e instanceof Error ? e.name : "UnknownError");
    const message = "Review action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
