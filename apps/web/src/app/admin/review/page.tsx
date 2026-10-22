import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getPartById } from "@beyoracle/catalog";
import { getDb, matchReviewQueue } from "@beyoracle/db";
import { isDbAvailable } from "@/lib/db-data";
import { ReviewQueueClient } from "@/components/ReviewQueueClient";
import { eq } from "drizzle-orm";

export default async function AdminReviewPage() {
  if (requireAdmin(new Request("http://internal/admin/review", { headers: await headers() }))) notFound();
  const dbOk = await isDbAvailable();

  if (!dbOk) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Match review queue</h1>
        <p className="mt-4 text-[var(--muted)]">
          Requires the Railway Postgres connection. Configure DATABASE_URL securely.
        </p>
      </div>
    );
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(matchReviewQueue)
    .where(eq(matchReviewQueue.status, "pending"));

  const items = rows.map((row) => {
    const part = row.suggestedPartId ? getPartById(row.suggestedPartId) : null;
    const suggestedLabel = row.suggestedProductId
      ? `product ${row.suggestedProductId}`
      : part
        ? `${part.nameEn} (${row.suggestedPartId})`
        : row.suggestedPartId ?? "unknown";

    return {
      id: row.id,
      observationId: row.observationId,
      title: row.title,
      suggestedPartId: row.suggestedPartId,
      suggestedProductId: row.suggestedProductId,
      suggestedLabel,
      confidence: row.confidence,
      method: row.method,
      createdAt: row.createdAt.toISOString(),
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Match review queue</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Pending medium-confidence matches (0.60–0.90). Approve to persist as comps; reject to discard.
      </p>
      {/* v1: no auth — local dev tool only; add session/admin gate before prod */}
      <ReviewQueueClient items={items} />
    </div>
  );
}
