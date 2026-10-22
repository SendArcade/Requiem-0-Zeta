import Link from "next/link";
import { GENERATION_LABELS } from "@/lib/generation-labels";
import { GENERATIONS } from "@beyoracle/shared";
import { browseProducts } from "@/lib/product-data";

export const dynamic = "force-dynamic";

const GEN_DESCRIPTIONS: Record<(typeof GENERATIONS)[number], string> = {
  plastic: "Classic HMS & early tops",
  metal: "Metal Fight Beyblade era",
  burst: "Burst system layers & drivers",
  x: "Beyblade X BX & UX lines",
};

export default async function BrowsePage() {
  const products = await browseProducts();
  const productCount = products.length;

  return (
    <div className="space-y-10">
      <header className="max-w-2xl">
        <p className="text-label mb-2">Catalog</p>
        <h1 className="text-3xl font-semibold tracking-tight">Browse</h1>
        <p className="mt-2 text-[var(--muted)]">
          Whole-SKU products and individual parts with calculated oracle marks.
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Whole products
        </h2>
        <Link href="/browse/products" className="card-interactive group block max-w-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-medium group-hover:text-[var(--accent)]">
                Whole-SKU products
              </div>
              <p className="mt-1.5 text-sm text-[var(--muted)]">
                Starters, sealed boxes, and complete Bey sets with calculated oracle marks.
              </p>
            </div>
            <span className="badge-gen shrink-0">{productCount.toLocaleString()} SKUs</span>
          </div>
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          By generation
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {GENERATIONS.map((gen) => (
            <Link key={gen} href={`/browse/${gen}`} className="card-interactive group">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-medium group-hover:text-[var(--accent)]">
                    {GENERATION_LABELS[gen]}
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">{GEN_DESCRIPTIONS[gen]}</p>
                </div>
                <span className="badge-gen shrink-0">{gen.toUpperCase()}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
