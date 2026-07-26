"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReviewItem = {
  id: string;
  observationId: string;
  title: string;
  suggestedPartId: string | null;
  suggestedProductId: string | null;
  suggestedLabel: string;
  confidence: number;
  method: string;
  createdAt: string;
};

export function ReviewQueueClient({ items }: { items: ReviewItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return <p className="mt-6 text-[var(--muted)]">No pending review items.</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      {error && (
        <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Suggested:{" "}
                <span className="text-[var(--text)]">{item.suggestedLabel}</span>
                {" · "}
                {(item.confidence * 100).toFixed(1)}% · {item.method}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {new Date(item.createdAt).toLocaleString()} · obs {item.observationId.slice(0, 8)}…
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => act(item.id, "approve")}
                className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => act(item.id, "reject")}
                className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
