import Link from "next/link";
import { GENERATION_LABELS } from "@/lib/generation-labels";
import type { Generation } from "@beyoracle/shared";
import { SearchBox } from "@/components/SearchBox";
import { searchUnified, type SearchResultItem } from "@/lib/data";

export const dynamic = "force-dynamic";

const SKU_LABELS: Record<string, string> = {
  sealed: "Sealed",
  starter: "Starter",
  complete_loose: "Complete (loose)",
  complete_sealed: "Complete (sealed)",
};

function formatJpy(n: number) {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function resultHref(item: SearchResultItem) {
  return item.kind === "product" ? `/product/${item.id}` : `/asset/${item.id}`;
}

function resultKindLabel(item: SearchResultItem) {
  if (item.kind === "product") {
    return SKU_LABELS[item.skuType] ?? "Whole SKU";
  }
  return item.partType;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q ? await searchUnified(q) : [];
  const productCount = results.filter((r) => r.kind === "product").length;
  const partCount = results.filter((r) => r.kind === "part").length;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Search</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Products and parts with calculated oracle marks
      </p>

      <div className="mt-6 max-w-2xl">
        <SearchBox defaultValue={q} />
      </div>

      {q && (
        <p className="mt-4 text-xs tabular-nums text-[var(--muted)]">
          {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
          {results.length > 0 && (
            <>
              {" "}
              · {productCount} product{productCount !== 1 ? "s" : ""} · {partCount} part
              {partCount !== 1 ? "s" : ""}
            </>
          )}
        </p>
      )}

      {q && results.length > 0 && (
        <div className="card mt-4 overflow-hidden p-0">
          <ul className="divide-y divide-[var(--border)]/40">
            {results.map((item) => {
              const genLabel = GENERATION_LABELS[item.generation as Generation] ?? item.generation;
              return (
                <li key={`${item.kind}:${item.id}`}>
                  <Link
                    href={resultHref(item)}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{item.nameEn}</span>
                        <span
                          className={
                            item.kind === "product"
                              ? "rounded border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--accent)]"
                              : "rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]"
                          }
                        >
                          {item.kind === "product" ? "Product" : "Part"}
                        </span>
                        <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                          {genLabel}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-[var(--muted)]">
                        {item.productCodes.join(", ") || "—"}
                        <span className="mx-1.5 text-[var(--border)]">·</span>
                        <span className="capitalize">{resultKindLabel(item)}</span>
                        <span className="mx-1.5 text-[var(--border)]">·</span>
                        <span>
                          {item.nComps} comp{item.nComps !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right tabular-nums">
                      {item.oracleValue != null ? (
                        <span className="font-semibold text-[var(--accent)]">
                          {formatJpy(item.oracleValue)}
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">—</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {q && results.length === 0 && (
        <p className="mt-8 text-center text-sm text-[var(--muted)]">
          No matches with comps yet — try another product code, SKU name, or part alias.
        </p>
      )}

      {!q && (
        <p className="mt-8 text-sm text-[var(--muted)]">
          Start typing to search products and parts with comps.
        </p>
      )}
    </div>
  );
}
