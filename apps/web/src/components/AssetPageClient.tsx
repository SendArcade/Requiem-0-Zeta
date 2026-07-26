"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import type { Condition, SourceId } from "@beyoracle/shared";
import type { BeyoracleEvent } from "@beyoracle/events";
import { CONDITION_LABELS, CONDITIONS, SOURCES } from "@beyoracle/shared";
import { CompsChart, CompsTable, SourceToggles } from "@/components/AssetClient";
import { LiveSalesFeed } from "@/components/LiveSalesFeed";
import type { AssetData } from "@/lib/data";

function confidenceColor(c: string) {
  if (c === "high") return "bg-emerald-500/20 text-emerald-400";
  if (c === "medium") return "bg-amber-500/20 text-amber-400";
  return "bg-slate-500/20 text-slate-400";
}

export function AssetPageClient({
  initial,
  initialSources,
  initialConditions,
  inWatchlist: initialWatchlist,
}: {
  initial: AssetData;
  initialSources: SourceId[];
  initialConditions: Condition[];
  inWatchlist: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initial);
  const [sources, setSources] = useState<SourceId[]>(initialSources);
  const [conditions, setConditions] = useState<Condition[]>(initialConditions);
  const [inWatchlist, setInWatchlist] = useState(initialWatchlist);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(
    (nextSources: SourceId[], nextConditions: Condition[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sources", nextSources.join(","));
      params.set("conditions", nextConditions.join(","));
      router.replace(`?${params.toString()}`, { scroll: false });

      startTransition(async () => {
        const qs = new URLSearchParams({
          sources: nextSources.join(","),
          conditions: nextConditions.join(","),
        });
        const res = await fetch(`/api/asset/${initial.part.id}?${qs}`);
        if (res.ok) {
          const json = (await res.json()) as AssetData;
          setData(json);
        }
      });
    },
    [initial.part.id, router, searchParams]
  );

  const onNewSale = useCallback(
    (_event: Extract<BeyoracleEvent, { type: "sale" }>) => {
      refresh(sources, conditions);
    },
    [refresh, sources, conditions]
  );

  async function toggleWatchlist() {
    const method = inWatchlist ? "DELETE" : "POST";
    const res = await fetch("/api/watchlist", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partId: initial.part.id }),
    });
    if (res.ok) setInWatchlist(!inWatchlist);
  }

  function toggleCondition(c: Condition) {
    const next = conditions.includes(c)
      ? conditions.filter((x) => x !== c)
      : [...conditions, c];
    if (next.length === 0) return;
    setConditions(next);
    refresh(sources, next);
  }

  const { part, oracle, oracleByCondition } = data;

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/browse/${part.generation}`} className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
          ← {part.generation.toUpperCase()}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{part.nameEn}</h1>
            {part.nameJp && <p className="text-[var(--muted)]">{part.nameJp}</p>}
            {part.nameZh && <p className="text-[var(--muted)]">{part.nameZh}</p>}
            <p className="mt-1 text-sm">
              {part.productCodes.join(" · ")} · {part.partType}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleWatchlist}
            className="btn-ghost"
          >
            {inWatchlist ? "★ On watchlist" : "☆ Add to watchlist"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-[var(--muted)]">
              Oracle Value · used / like-new comps (excludes sealed retail)
            </div>
            {oracle ? (
              <>
                <div className="text-4xl font-bold text-[var(--accent)]">
                  ¥{oracle.value.toLocaleString()}
                  {pending && <span className="ml-2 text-sm font-normal text-[var(--muted)]">…</span>}
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  IQR ¥{oracle.low.toLocaleString()} – ¥{oracle.high.toLocaleString()}
                  {oracle.low != null && oracle.high != null && (
                    <> · 90% CI ¥{oracle.low.toLocaleString()} – ¥{oracle.high.toLocaleString()}</>
                  )}{" "}
                  · {oracle.nComps} sold comp{oracle.nComps !== 1 ? "s" : ""} (90d)
                  {oracle.nEffective != null && oracle.engine === "v2" && (
                    <> · n<sub>eff</sub> {oracle.nEffective.toFixed(1)}</>
                  )}
                </div>
                {oracle.regionEstimates && oracle.regionEstimates.length > 1 && (
                  <div className="mt-2 text-sm text-[var(--muted)]">
                    {oracle.regionEstimates
                      .filter((r) => r.region === "tw")
                      .map((r) => (
                        <span key={r.region}>
                          ~¥{r.value.toLocaleString()} in TW
                          {r.premiumPct !== 0 && (
                            <span> (+{r.premiumPct}% vs JP)</span>
                          )}
                        </span>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-lg text-[var(--muted)]">Insufficient data</div>
            )}
          </div>
          {oracle && (
            <span className={`badge ${confidenceColor(oracle.confidence)}`}>
              {oracle.confidence} confidence
            </span>
          )}
        </div>

        {Object.keys(oracleByCondition).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {CONDITIONS.map((c) => {
              const snap = oracleByCondition[c];
              if (!snap) return null;
              return (
                <span
                  key={c}
                  className="rounded border border-[var(--border)] px-2 py-1 text-[var(--muted)]"
                >
                  {CONDITION_LABELS[c]}: ¥{snap.value.toLocaleString()} ({snap.nComps})
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-6 border-t border-[var(--border)] pt-4 space-y-4">
          <div>
            <div className="mb-2 text-sm font-medium">Include sources</div>
            <SourceToggles
              sources={[...SOURCES]}
              active={sources}
              onChange={(next) => {
                setSources(next);
                refresh(next, conditions);
              }}
            />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">Include conditions</div>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCondition(c)}
                  className={
                    conditions.includes(c)
                      ? "badge bg-[var(--accent)]/20 text-[var(--accent)]"
                      : "badge bg-slate-500/10 text-[var(--muted)]"
                  }
                >
                  {CONDITION_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Toggles recompute from stored comps — no re-scrape.
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">Price history</h2>
        <CompsChart
          comps={data.comps}
          data={data.chart}
          currentMark={oracle?.value ?? null}
          markLow={oracle?.low ?? null}
          markHigh={oracle?.high ?? null}
          confidence={oracle?.confidence}
        />
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Sold comps</h2>
          <LiveSalesFeed partId={part.id} onNewSale={onNewSale} />
        </div>
        <CompsTable comps={data.comps} />
      </div>
    </div>
  );
}
