import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium text-[var(--text)]">Beyoracle</p>
          <p className="mt-1 max-w-md text-xs text-[var(--muted)]">
            Oracle only — comps from Mercari JP, Yahoo Auctions &amp; more. Not affiliated with Takara
            Tomy.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--muted)]">
          <Link href="/browse" className="transition-colors hover:text-[var(--text)]">
            Browse
          </Link>
          <Link href="/browse/products" className="transition-colors hover:text-[var(--text)]">
            Products
          </Link>
          <Link href="/watchlist" className="transition-colors hover:text-[var(--text)]">
            Watchlist
          </Link>
        </nav>
      </div>
    </footer>
  );
}
