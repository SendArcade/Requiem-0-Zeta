import Link from "next/link";
import { GENERATION_LABELS } from "@/lib/generation-labels";
import { GENERATIONS } from "@beyoracle/shared";
import { SearchBox } from "@/components/SearchBox";
import { browseGeneration } from "@/lib/data";
import { browseProducts } from "@/lib/product-data";

export default async function HomePage() {
  const [products, ...partsByGen] = await Promise.all([
    browseProducts(),
    ...GENERATIONS.map((gen) => browseGeneration(gen)),
  ]);

  const publishedParts = partsByGen.flat();
  const partsByGeneration = Object.fromEntries(
    GENERATIONS.map((gen, i) => [gen, partsByGen[i]?.length ?? 0])
  ) as Record<(typeof GENERATIONS)[number], number>;

  const featured = publishedParts.slice(0, 3);

  return (
    <div className="space-y-16">
      <section className="mx-auto max-w-3xl pt-8 text-center sm:pt-12">
        <p className="text-label mb-4">Beyblade oracle</p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
          Trusted fair value for every generation
        </h1>
        <p className="mt-4 text-base text-[var(--muted)] sm:text-lg">
          Whole-SKU products and parts with live sold comps — more added as ingest runs.
        </p>
        <div className="mx-auto mt-8 max-w-xl">
          <SearchBox />
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Browse by generation</h2>
          <Link href="/browse" className="nav-link text-sm">
            View all →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {GENERATIONS.map((gen) => (
            <Link key={gen} href={`/browse/${gen}`} className="gen-pill gap-2">
              {GENERATION_LABELS[gen]}
              <span className="text-xs text-[var(--muted)]">{partsByGeneration[gen]}</span>
            </Link>
          ))}
          <Link href="/browse/products" className="gen-pill border-[var(--accent)]/30 text-[var(--accent)]">
            Products
            <span className="text-xs text-[var(--muted)]">{products.length}</span>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-lg font-semibold tracking-tight">Catalog</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GENERATIONS.map((gen) => (
            <Link key={gen} href={`/browse/${gen}`} className="card-interactive group">
              <div className="flex items-start justify-between gap-2">
                <div className="text-base font-medium group-hover:text-[var(--accent)]">
                  {GENERATION_LABELS[gen]}
                </div>
                <span className="badge-gen">{gen.toUpperCase()}</span>
              </div>
              <div className="mt-2 text-sm text-[var(--muted)]">
                {partsByGeneration[gen]} parts with comps
              </div>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section>
          <h2 className="mb-5 text-lg font-semibold tracking-tight">Featured parts</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <Link key={p.id} href={`/asset/${p.id}`} className="card-interactive">
                <div className="font-medium">{p.nameEn}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                  <span>{p.productCodes.join(", ")}</span>
                  <span className="badge-gen">{p.generation.toUpperCase()}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
