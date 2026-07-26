"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { GENERATION_LABELS } from "@/lib/generation-labels";
import type { Generation } from "@beyoracle/shared";
import { GENERATIONS, SKU_TYPES } from "@beyoracle/shared";

const SKU_LABELS: Record<string, string> = {
  sealed: "Sealed",
  starter: "Starter",
  complete_loose: "Complete (loose)",
  complete_sealed: "Complete (sealed)",
};

const CONFIDENCE_OPTIONS = [
  { value: "", label: "All" },
  { value: "has_mark", label: "Has mark" },
  { value: "sparse", label: "Sparse" },
] as const;

export interface ProductBrowseFilterState {
  generation?: Generation;
  skuType?: (typeof SKU_TYPES)[number];
  confidence?: "has_mark" | "sparse";
}

function filterHref(base: string, next: ProductBrowseFilterState): string {
  const params = new URLSearchParams();
  if (next.generation) params.set("generation", next.generation);
  if (next.skuType) params.set("sku_type", next.skuType);
  if (next.confidence) params.set("confidence", next.confidence);
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

function pillClass(active: boolean) {
  return active
    ? "rounded-md border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-3 py-1.5 text-xs font-medium text-[var(--accent)]"
    : "rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)]/30 hover:text-[var(--text)]";
}

export function ProductBrowseFilters({
  filters,
}: {
  filters: ProductBrowseFilterState;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const navigate = useCallback(
    (next: ProductBrowseFilterState) => {
      startTransition(() => {
        router.push(filterHref("/browse/products", next));
      });
    },
    [router]
  );

  const basePath = "/browse/products";
  const hasFilters = filters.generation || filters.skuType || filters.confidence;

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          Gen
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={filterHref(basePath, { ...filters, generation: undefined })}
            className={pillClass(!filters.generation)}
          >
            All
          </Link>
          {GENERATIONS.map((gen) => (
            <Link
              key={gen}
              href={filterHref(basePath, {
                ...filters,
                generation: filters.generation === gen ? undefined : gen,
              })}
              className={pillClass(filters.generation === gen)}
            >
              {GENERATION_LABELS[gen]}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          Type
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={filterHref(basePath, { ...filters, skuType: undefined })}
            className={pillClass(!filters.skuType)}
          >
            All types
          </Link>
          {SKU_TYPES.map((sku) => (
            <Link
              key={sku}
              href={filterHref(basePath, {
                ...filters,
                skuType: filters.skuType === sku ? undefined : sku,
              })}
              className={pillClass(filters.skuType === sku)}
            >
              {SKU_LABELS[sku] ?? sku}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          Mark
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CONFIDENCE_OPTIONS.map(({ value, label }) => {
            const active =
              (value === "" && !filters.confidence) || filters.confidence === value;
            return (
              <button
                key={value || "all"}
                type="button"
                onClick={() =>
                  navigate({
                    ...filters,
                    confidence:
                      value === ""
                        ? undefined
                        : (value as ProductBrowseFilterState["confidence"]),
                  })
                }
                className={pillClass(active)}
              >
                {label}
              </button>
            );
          })}
        </div>
        {hasFilters && (
          <Link
            href={basePath}
            className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--accent)]"
          >
            Clear all
          </Link>
        )}
      </div>
    </div>
  );
}
