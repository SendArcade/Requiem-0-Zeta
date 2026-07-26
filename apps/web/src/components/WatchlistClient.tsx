"use client";

import Link from "next/link";
import { useState } from "react";

interface WatchlistItem {
  part: {
    id: string;
    nameEn: string;
    productCodes: string[];
  };
  oracle: { value: number; nComps: number } | null;
  baselineValue: number | null;
  alertThresholdPct: number;
}

interface AlertItem {
  id: string;
  partId: string;
  partName: string;
  previousValue: number;
  newValue: number;
  dropPct: number;
  thresholdPct: number;
  read: boolean;
  createdAt: string;
}

export function WatchlistClient({
  items,
  alerts: initialAlerts,
}: {
  items: WatchlistItem[];
  alerts: AlertItem[];
}) {
  const [alerts, setAlerts] = useState(initialAlerts);

  async function markAllRead() {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setAlerts((a) => a.map((x) => ({ ...x, read: true })));
  }

  const unread = alerts.filter((a) => !a.read);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Alerts fire when Oracle Value drops ≥ threshold% from your baseline (set when added).
        </p>
      </div>

      {unread.length > 0 && (
        <section className="card border-red-500/30">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-red-400">Price drop alerts</h2>
            <button type="button" onClick={markAllRead} className="btn-ghost text-xs">
              Mark all read
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {unread.map((a) => (
              <li key={a.id}>
                <Link href={`/asset/${a.partId}`} className="hover:text-[var(--accent)]">
                  <span className="font-medium">{a.partName}</span>
                  {" — "}
                  ¥{a.previousValue.toLocaleString()} → ¥{a.newValue.toLocaleString()} (
                  −{a.dropPct.toFixed(0)}%, threshold {a.thresholdPct}%)
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length === 0 ? (
        <p className="text-[var(--muted)]">
          No saved parts. Add from any{" "}
          <Link href="/browse" className="text-[var(--accent)] hover:underline">
            asset page
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.part.id}>
              <Link
                href={`/asset/${item.part.id}`}
                className="card flex items-center justify-between hover:border-[var(--accent)]"
              >
                <div>
                  <div className="font-medium">{item.part.nameEn}</div>
                  <div className="text-sm text-[var(--muted)]">
                    {item.part.productCodes.join(", ")}
                    {item.baselineValue != null && (
                      <span className="ml-2">
                        · baseline ¥{item.baselineValue.toLocaleString()} · alert −
                        {item.alertThresholdPct}%
                      </span>
                    )}
                  </div>
                </div>
                {item.oracle ? (
                  <div className="text-right">
                    <div className="font-semibold text-[var(--accent)]">
                      ¥{item.oracle.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {item.oracle.nComps} comps
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-[var(--muted)]">No mark</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {alerts.filter((a) => a.read).length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-[var(--muted)]">Past alerts</h2>
          <ul className="space-y-1 text-sm text-[var(--muted)]">
            {alerts
              .filter((a) => a.read)
              .map((a) => (
                <li key={a.id}>
                  {a.partName}: −{a.dropPct.toFixed(0)}% on{" "}
                  {new Date(a.createdAt).toLocaleDateString()}
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
