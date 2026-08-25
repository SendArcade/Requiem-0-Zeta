import Link from "next/link";
import { Suspense } from "react";
import { GENERATION_LABELS } from "@/lib/generation-labels";
import type { Generation, SkuType } from "@beyoracle/shared";
import { GENERATIONS, SKU_TYPES } from "@beyoracle/shared";
import { ProductBrowseFilters, type ProductBrowseFilterState } from "@/components/ProductBrowseFilters";
import { browseProducts, type BrowseProductRow } from "@/lib/product-data";

const SKU_LABELS: Record<string, string> = {
  sealed: "Sealed",
  starter: "Starter",
  complete_loose: "Complete (loose)",
  complete_sealed: "Complete (sealed)",
};

function formatJpy(n: number) {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function parseFilters(searchParams: {
  generation?: string;
  sku_type?: string;
}): ProductBrowseFilterState {
  const generation = GENERATIONS.includes(searchParams.generation as Generation)
    ? (searchParams.generation as Generation)
    : undefined;
  const skuType = SKU_TYPES.includes(searchParams.sku_type as SkuType)
    ? (searchParams.sku_type as SkuType)
    : undefined;
  return { generation, skuType };
}

function applyFilters(
  products: BrowseProductRow[],
  filters: ProductBrowseFilterState
): BrowseProductRow[] {
  return products.filter((p) => {
    if (filters.generation && p.generation !== filters.generation) return false;
    if (filters.skuType && p.skuType !== filters.skuType) return false;
    return true;
  });
}

function ProductTable({ products }: { products: BrowseProductRow[] }) {
  if (products.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">
        No products match the current filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-black/20 text-[10px] uppercase tracking-wider text-[var(--muted)]">
            <th className="px-4 py-3 font-semibold">Product</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Code</th>
            <th className="px-4 py-3 text-right font-semibold">Oracle Value</th>
            <th className="px-4 py-3 text-right font-semibold">Comps</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[var(--border)]/40 transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/product/${p.id}`}
                    className="font-medium text-[var(--text)] hover:text-[var(--accent)]"
                  >
                    {p.nameEn}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {SKU_LABELS[p.skuType] ?? p.skuType}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                  {p.productCodes[0] ?? "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {p.oracleValue != null ? (
                    <div>
                      <span className="font-semibold text-[var(--accent)]">
                        {formatJpy(p.oracleValue)}
                      </span>
                      {p.oracleLow != null && p.oracleHigh != null && (
                        <div className="text-[10px] text-[var(--muted)]">
                          {formatJpy(p.oracleLow)} – {formatJpy(p.oracleHigh)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className="text-[var(--muted)]">{p.nComps}</span>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function BrowseProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ generation?: string; sku_type?: string }>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const products = await browseProducts();
  const filtered = applyFilters(products, filters);

  const byGeneration = (filters.generation ? [filters.generation] : GENERATIONS)
    .map((gen) => ({
      generation: gen as Generation,
      products: filtered.filter((p) => p.generation === gen),
    }))
    .filter((g) => g.products.length > 0);

  return (
    <div>
      <Link href="/browse" className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">
        ← Browse
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Whole-SKU products with calculated oracle marks — starters, sealed boxes, complete Bey sets
          </p>
        </div>
        <p className="text-sm tabular-nums text-[var(--muted)]">
          {filtered.length} SKU{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      <Suspense fallback={null}>
        <ProductBrowseFilters filters={filters} />
      </Suspense>

      <div className="mt-6 space-y-8">
        {byGeneration.length === 0 ? (
          <div className="card overflow-hidden p-0">
            <ProductTable products={[]} />
          </div>
        ) : (
          byGeneration.map(({ generation, products }) => (
            <section key={generation}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide">
                  {GENERATION_LABELS[generation]}
                </h2>
                <span className="text-xs tabular-nums text-[var(--muted)]">
                  {products.length} SKU{products.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="card overflow-hidden p-0">
                <ProductTable products={products} />
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
