"use client";

import { useEffect, useRef, useState } from "react";
import type { BeyoracleEvent } from "@beyoracle/events";
import { SOURCE_LABELS } from "@beyoracle/shared";

export function LiveSalesFeed({
  partId,
  productId,
  onNewSale,
}: {
  partId?: string;
  productId?: string;
  onNewSale?: (event: Extract<BeyoracleEvent, { type: "sale" }>) => void;
}) {
  const [connected, setConnected] = useState(false);
  const [recent, setRecent] = useState<Extract<BeyoracleEvent, { type: "sale" }>[]>([]);
  const onNewSaleRef = useRef(onNewSale);
  onNewSaleRef.current = onNewSale;

  useEffect(() => {
    const params = new URLSearchParams();
    if (partId) params.set("partId", partId);
    if (productId) params.set("productId", productId);

    const es = new EventSource(`/api/events?${params}`);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as BeyoracleEvent;
        if (event.type !== "sale") return;
        if (partId && event.partId !== partId) return;
        if (productId && event.productId !== productId) return;

        setRecent((prev) => [event, ...prev].slice(0, 8));
        onNewSaleRef.current?.(event);
      } catch {
        /* ignore malformed */
      }
    };

    return () => es.close();
  }, [partId, productId]);

  if (recent.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span
          className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-500"}`}
        />
        {connected ? "Live feed connected" : "Connecting…"}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        New sales
      </div>
      <ul className="space-y-1 text-sm">
        {recent.map((s) => (
          <li key={`${s.observationId}-${s.observedAt}`} className="flex justify-between gap-2">
            <a href={s.url} target="_blank" rel="noreferrer" className="truncate hover:text-[var(--accent)]">
              {s.title}
            </a>
            <span className="shrink-0 text-[var(--muted)]">
              ¥{s.price.toLocaleString()} · {SOURCE_LABELS[s.source]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
