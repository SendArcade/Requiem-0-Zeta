"use client";

import Link from "next/link";
import type { ProductData } from "@/lib/product-data";
import { GENERATION_LABELS } from "@/lib/generation-labels";
import { DEFAULT_PUBLISHED_MIN_COMPS } from "@beyoracle/shared";
import { CompsChart, CompsTable } from "@/components/AssetClient";
import { LiveSalesFeed } from "@/components/LiveSalesFeed";

const SKU_LABELS: Record<string, string> = {
  sealed: "Sealed box",
  starter: "Starter set",
  complete_loose: "Complete Bey (loose)",
  complete_sealed: "Complete Bey (sealed)",
};

function formatUsd(n: number) {
  return `$${n.toFixed(2)}`;
}

function retailShelfLabel(sources: string[]): string {
  const labels: string[] = [];
  if (sources.includes("walmart_us")) labels.push("Walmart");
  if (sources.includes("amazon_us")) labels.push("Amazon");
  if (labels.length === 0) return "US big-box shelf";
  return labels.join(" · ") + " shelf";
}

function formatJpy(n: number) {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function confidenceColor(c: string) {
  if (c === "high") return "bg-emerald-500/20 text-emerald-400";
  if (c === "medium") return "bg-amber-500/20 text-amber-400";
  return "bg-slate-500/20 text-slate-400";
}

export function ProductPageClient({ initial }: { initial: ProductData }) {
  const { product, parts, recipe, oracle, retailReference, comps, chart } = initial;
  const sparse =
    oracle != null &&
    (oracle.nComps < DEFAULT_PUBLISHED_MIN_COMPS || oracle.confidence === "low");
  const recipeBlocked = !recipe.canPublishMark;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/browse/${product.generation}`}
          className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← {GENERATION_LABELS[product.generation]}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              Whole SKU · {SKU_LABELS[product.skuType] ?? product.skuType}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{product.nameEn}</h1>
            {product.nameJp && (
              <p className="mt-1 text-[var(--muted)]">{product.nameJp}</p>
            )}
            {product.productCodes.length > 0 && (
              <p className="mt-2 font-mono text-xs text-[var(--muted)]">
                {product.productCodes.join(" · ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-[var(--muted)]">
              Oracle Value · whole-SKU sold comps
            </div>
            {oracle ? (
              <>
                <div
                  className={`text-4xl font-bold tabular-nums ${sparse ? "text-[var(--muted)]" : "text-[var(--accent)]"}`}
                >
                  {formatJpy(oracle.value)}
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  IQR {formatJpy(oracle.low)} – {formatJpy(oracle.high)}
                  {oracle.low != null && oracle.high != null && (
                    <> · 90% CI {formatJpy(oracle.low)} – {formatJpy(oracle.high)}</>
                  )}{" "}
                  · {oracle.nComps} sold comp{oracle.nComps !== 1 ? "s" : ""}
                </div>
              </>
            ) : (
              <div className="mt-2 text-lg text-[var(--muted)]">Insufficient data</div>
            )}
          </div>
          {oracle && (
            <span className={`badge ${confidenceColor(oracle.confidence)}`}>
              {oracle.confidence} confidence
            </span>
          )}
        </div>

        {!oracle && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-4 py-3 text-sm"
          >
            <p className="font-medium text-[var(--warning)]">
              {recipeBlocked
                ? "Recipe incomplete — no whole-Bey mark"
                : "Insufficient data for Oracle Value"}
            </p>
            <p className="mt-1 text-[var(--muted)]">
              {recipeBlocked
                ? (recipe.blockReason ??
                  "This SKU needs a verified full component recipe before pricing.")
                : `Need ≥${DEFAULT_PUBLISHED_MIN_COMPS} whole-SKU sold comps — ingest starter/sealed listings to populate this mark.`}
            </p>
          </div>
        )}

        {sparse && oracle && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-4 py-3 text-sm"
          >
            <p className="font-medium text-[var(--warning)]">Low confidence mark</p>
            <p className="mt-1 text-[var(--muted)]">
              Only {oracle.nComps} sold comp{oracle.nComps !== 1 ? "s" : ""} — treat this Oracle
              Value as directional, not definitive.
            </p>
          </div>
        )}

        {retailReference && (!oracle || sparse) && (
          <div className="mt-4 rounded-lg border border-slate-500/30 bg-slate-500/10 px-4 py-3 text-sm">
            <p className="font-medium text-slate-300">
              US retail reference ({retailShelfLabel(retailReference.sources)})
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-200">
              {formatUsd(retailReference.value)}
              <span className="ml-2 text-sm font-normal text-[var(--muted)]">
                {formatUsd(retailReference.low)} – {formatUsd(retailReference.high)} ·{" "}
                {retailReference.nAsks} ask{retailReference.nAsks !== 1 ? "s" : ""}
              </span>
            </p>
            <p className="mt-1 text-[var(--muted)]">
              Current US big-box shelf price — not a sold comp. Useful when JP sold depth is thin;
              skews toward MSRP.
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Price history
        </h2>
        <CompsChart
          comps={comps}
          data={chart}
          currentMark={oracle?.value ?? null}
          markLow={oracle?.low ?? null}
          markHigh={oracle?.high ?? null}
          confidence={oracle?.confidence}
        />
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Sold comps
          </h2>
          <LiveSalesFeed productId={product.id} />
        </div>
        {comps.length > 0 ? (
          <CompsTable comps={comps} />
        ) : (
          <p className="text-sm text-[var(--muted)]">No sold comps yet for this SKU.</p>
        )}
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Part recipe
          </h2>
          <span
            className={`badge text-[10px] ${
              recipe.canPublishMark
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {recipe.recipeKind}
            {recipe.isComplete ? " · complete" : " · incomplete"}
          </span>
        </div>
        {recipe.blockReason && (
          <p className="mt-2 text-xs text-[var(--warning)]">{recipe.blockReason}</p>
        )}
        <ul className="card mt-3 divide-y divide-[var(--border)] overflow-hidden p-0">
          {recipe.slots.map((slot) => (
            <li key={slot.slot} className="flex items-center justify-between px-4 py-3">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {slot.slot.replace(/_/g, " ")}
              </span>
              {slot.partId ? (
                <Link
                  href={`/asset/${slot.partId}`}
                  className="text-sm font-medium hover:text-[var(--accent)]"
                >
                  {slot.partName}
                </Link>
              ) : (
                <span className="text-sm text-[var(--warning)]">Missing</span>
              )}
            </li>
          ))}
        </ul>
        {parts.length > recipe.slots.length && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            + {parts.length - recipe.slots.filter((s) => s.partId).length} additional parts in
            box contents
          </p>
        )}
      </section>
    </div>
  );
}
