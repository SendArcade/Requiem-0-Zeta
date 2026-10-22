import Link from "next/link";
import { notFound } from "next/navigation";
import { GENERATION_LABELS } from "@/lib/generation-labels";
import type { Generation } from "@beyoracle/shared";
import { GENERATIONS } from "@beyoracle/shared";
import { browseGeneration } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatJpy(n: number) {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

export default async function BrowseGenerationPage({
  params,
}: {
  params: Promise<{ generation: string }>;
}) {
  const { generation } = await params;
  if (!GENERATIONS.includes(generation as Generation)) notFound();

  const parts = await browseGeneration(generation as Generation);
  const gen = generation as Generation;

  return (
    <div>
      <Link href="/browse" className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">
        ← Browse
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{GENERATION_LABELS[gen]}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Parts with calculated oracle marks
          </p>
        </div>
        <p className="text-sm tabular-nums text-[var(--muted)]">
          {parts.length} part{parts.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="card mt-6 overflow-hidden p-0">
        {parts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">
            No parts with comps yet for this generation.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-black/20 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  <th className="px-4 py-3 font-semibold">Part</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 text-right font-semibold">Oracle Value</th>
                  <th className="px-4 py-3 text-right font-semibold">Comps</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--border)]/40 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/asset/${p.id}`}
                        className="font-medium text-[var(--text)] hover:text-[var(--accent)]"
                      >
                        {p.nameEn}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-[var(--muted)]">{p.partType}</td>
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
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--muted)]">
                      {p.nComps}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
