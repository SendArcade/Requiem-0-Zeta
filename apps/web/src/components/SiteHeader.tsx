"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GENERATION_LABELS } from "@/lib/generation-labels";
import { GENERATIONS } from "@beyoracle/shared";
import { AlertBell } from "@/components/AlertBell";
import { SearchBox } from "@/components/SearchBox";

const NAV_LINKS = [
  { href: "/browse", label: "Browse" },
  { href: "/browse/products", label: "Products" },
  { href: "/watchlist", label: "Watchlist" },
] as const;

function navClass(href: string, pathname: string) {
  const active =
    href === "/browse"
      ? pathname === "/browse" || pathname.startsWith("/browse/plastic") || pathname.startsWith("/browse/metal") || pathname.startsWith("/browse/burst") || pathname.startsWith("/browse/x")
      : pathname === href || pathname.startsWith(`${href}/`);
  return active ? "nav-link nav-link-active" : "nav-link";
}

function genPillClass(gen: string, pathname: string) {
  return pathname.startsWith(`/browse/${gen}`) ? "gen-pill gen-pill-active" : "gen-pill";
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] header-blur">
      <div className="mx-auto flex h-[var(--header-height)] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/requiem"
          className="shrink-0 text-lg font-semibold tracking-tight text-[var(--text)] transition-colors hover:text-[var(--accent)]"
        >
          Beyoracle
        </Link>

        <div className="hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg [&_button]:px-3 [&_button]:py-2 [&_form]:gap-2 [&_input]:py-2 [&_input]:text-sm">
          <SearchBox />
        </div>

        <nav className="ml-auto flex shrink-0 items-center gap-5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={navClass(href, pathname)}>
              {label}
            </Link>
          ))}
          <AlertBell />
        </nav>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex h-[var(--gen-nav-height)] max-w-7xl items-center gap-2 overflow-x-auto px-4 sm:px-6 lg:px-8">
          <Link href="/browse" className={pathname === "/browse" ? "gen-pill gen-pill-active" : "gen-pill"}>
            All
          </Link>
          {GENERATIONS.map((gen) => (
            <Link key={gen} href={`/browse/${gen}`} className={genPillClass(gen, pathname)}>
              {GENERATION_LABELS[gen]}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-4 py-3 md:hidden [&_button]:px-3 [&_button]:py-2 [&_form]:gap-2 [&_input]:py-2 [&_input]:text-sm">
        <SearchBox />
      </div>
    </header>
  );
}
