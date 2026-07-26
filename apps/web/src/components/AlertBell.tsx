"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AlertEvent } from "@beyoracle/events";

export function AlertBell() {
  const [unread, setUnread] = useState(0);
  const [latest, setLatest] = useState<AlertEvent | null>(null);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d: { unread?: number }) => setUnread(d.unread ?? 0))
      .catch(() => undefined);

    const es = new EventSource("/api/events");
    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        if (event.type === "alert") {
          setLatest(event as AlertEvent);
          setUnread((n) => n + 1);
        }
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, []);

  return (
    <Link
      href="/watchlist"
      className="relative hover:text-[var(--text)]"
      title={latest ? `${latest.partName} dropped ${latest.dropPct.toFixed(0)}%` : "Watchlist alerts"}
    >
      Alerts
      {unread > 0 && (
        <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
