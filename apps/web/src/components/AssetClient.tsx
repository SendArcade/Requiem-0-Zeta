"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompRow } from "@/lib/data";
import { altChart, type AltChartRange } from "@/lib/alt-design-tokens";
import { CONDITION_LABELS, evidenceLabel, MATCH_METHOD_LABELS, SOURCE_LABELS } from "@beyoracle/shared";
import type { Condition, SourceId } from "@beyoracle/shared";

/* ── shared formatting ───────────────────────────────────────────── */

export function formatJpy(n: number) {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function formatChartDate(ts: number) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(ts)
  );
}

function formatTableDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

/* ── filter pills (pool / condition) ───────────────────────────── */

export function FilterPill({
  active,
  children,
  onClick,
  disabled,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        active
          ? "inline-flex items-center rounded-md border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent)] transition-colors"
          : "inline-flex items-center rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}

export function ConfidenceBadge({
  confidence,
  nComps,
}: {
  confidence: "high" | "medium" | "low";
  nComps: number;
}) {
  const styles = {
    high: "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]",
    medium: "border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]",
    low: "border-[var(--muted)]/30 bg-[var(--muted)]/10 text-[var(--muted-strong)]",
  }[confidence];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${styles}`}>
      {confidence} confidence
      <span className="text-[var(--muted)]">·</span>
      <span className="tabular-nums">{nComps} comps</span>
    </span>
  );
}

function rangeCutoffMs(range: AltChartRange): number | null {
  const day = 24 * 60 * 60 * 1000;
  switch (range) {
    case "1M":
      return Date.now() - 30 * day;
    case "3M":
      return Date.now() - 90 * day;
    case "6M":
      return Date.now() - 180 * day;
    case "1Y":
      return Date.now() - 365 * day;
    case "ALL":
      return null;
  }
}

function filterChartInputByRange<
  T extends { date: string },
>(points: T[], range: AltChartRange): T[] {
  const cutoff = rangeCutoffMs(range);
  if (cutoff == null) return points;
  return points.filter((p) => {
    const ts = new Date(p.date.length > 10 ? p.date : `${p.date}T12:00:00`).getTime();
    return ts >= cutoff;
  });
}

function ChartRangePills({
  active,
  onChange,
}: {
  active: AltChartRange;
  onChange: (range: AltChartRange) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {altChart.ranges.map((range) => (
        <FilterPill key={range} active={active === range} onClick={() => onChange(range)}>
          {range}
        </FilterPill>
      ))}
    </div>
  );
}

type ScatterPoint = {
  ts: number;
  price: number;
  date: string;
  source?: SourceId;
  condition?: string;
  title?: string;
};

type LinePoint = {
  ts: number;
  median: number;
  date: string;
};

function buildChartData(
  points: Array<{ date: string; price: number; source?: SourceId; condition?: string; title?: string }>,
  currentMark?: number | null
): { scatter: ScatterPoint[]; line: LinePoint[] } {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const prices: number[] = [];
  const scatter: ScatterPoint[] = [];
  const line: LinePoint[] = [];

  for (const p of sorted) {
    prices.push(p.price);
    const ts = new Date(p.date.length > 10 ? p.date : `${p.date}T12:00:00`).getTime();
    scatter.push({
      ts,
      price: p.price,
      date: p.date.slice(0, 10),
      source: p.source,
      condition: p.condition,
      title: p.title,
    });
    line.push({
      ts,
      median: median(prices),
      date: p.date.slice(0, 10),
    });
  }

  if (currentMark != null && line.length > 0) {
    line.push({ ts: Date.now(), median: currentMark, date: "Today" });
  }

  return { scatter, line };
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScatterPoint & { median?: number }; dataKey?: string }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  const isSale = p.price != null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-xl">
      <p className="text-[var(--muted)]">{formatChartDate(p.ts)}</p>
      {isSale ? (
        <>
          <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text)]">
            {formatJpy(p.price)}
          </p>
          {p.source && (
            <p className="mt-0.5 text-[var(--muted)]">{SOURCE_LABELS[p.source]}</p>
          )}
          {p.condition && (
            <p className="capitalize text-[var(--muted)]">
              {CONDITION_LABELS[p.condition as Condition] ?? p.condition.replace("_", " ")}
            </p>
          )}
        </>
      ) : (
        <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--accent)]">
          Mark {formatJpy(p.median ?? 0)}
        </p>
      )}
    </div>
  );
}

export function CompsChart({
  data,
  comps,
  currentMark,
  markLow,
  markHigh,
  confidence,
}: {
  /** Legacy: individual comp points from buildTimeSeries */
  data?: Array<{ date: string; price: number }>;
  comps?: CompRow[];
  currentMark?: number | null;
  markLow?: number | null;
  markHigh?: number | null;
  confidence?: "high" | "medium" | "low";
}) {
  const [range, setRange] = useState<AltChartRange>(altChart.defaultRange);

  const chartInput = useMemo(() => {
    if (comps && comps.length > 0) {
      return comps.map((c) => ({
        date: c.observedAt,
        price: c.displayPrice,
        source: c.source,
        condition: c.condition,
        title: c.title,
      }));
    }
    return data ?? [];
  }, [comps, data]);

  const filteredInput = useMemo(
    () => filterChartInputByRange(chartInput, range),
    [chartInput, range]
  );

  const { scatter, line } = useMemo(
    () => buildChartData(filteredInput, currentMark),
    [filteredInput, currentMark]
  );

  const mutedMark = confidence === "low" || currentMark == null;
  const accentColor = mutedMark ? "var(--muted)" : "var(--accent)";
  const scatterColor = mutedMark ? "var(--muted)" : "var(--accent-dim)";
  const bandFill = mutedMark ? "var(--muted)" : "var(--accent)";

  if (chartInput.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-white/[0.02] text-sm text-[var(--muted)]">
        No sold comps for selected filters
      </div>
    );
  }

  if (scatter.length === 0) {
    return (
      <div>
        <ChartRangePills active={range} onChange={setRange} />
        <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-white/[0.02] text-sm text-[var(--muted)]">
          No sold comps in {range} window
        </div>
      </div>
    );
  }

  const yMin = Math.min(
    ...scatter.map((s) => s.price),
    markLow ?? Infinity,
    currentMark ?? Infinity
  );
  const yMax = Math.max(
    ...scatter.map((s) => s.price),
    markHigh ?? -Infinity,
    currentMark ?? -Infinity
  );
  const yPad = (yMax - yMin) * 0.12 || yMax * 0.1 || 100;

  return (
    <div className="mt-2">
      <ChartRangePills active={range} onChange={setRange} />
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart margin={{ top: 12, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            type="number"
            dataKey="ts"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatChartDate}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `¥${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
            domain={[yMin - yPad, yMax + yPad]}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />

          {markLow != null && markHigh != null && markLow < markHigh && (
            <ReferenceArea
              y1={markLow}
              y2={markHigh}
              fill={bandFill}
              fillOpacity={0.06}
              strokeOpacity={0}
            />
          )}

          {currentMark != null && (
            <ReferenceLine
              y={currentMark}
              stroke={accentColor}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: "Current mark",
                position: "insideTopRight",
                fill: accentColor,
                fontSize: 10,
              }}
            />
          )}

          <Line
            data={line}
            type="monotone"
            dataKey="median"
            stroke={accentColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: accentColor }}
            isAnimationActive={false}
          />
          <Scatter
            data={scatter}
            dataKey="price"
            fill={scatterColor}
            stroke={scatterColor}
            strokeWidth={1}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-wider text-[var(--muted)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: accentColor }} />
          Rolling median
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: scatterColor }} />
          Sold comp
        </span>
        {currentMark != null && (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0 w-4 border-t border-dashed"
              style={{ borderColor: accentColor }}
            />
            Current mark
          </span>
        )}
      </div>
    </div>
  );
}

/* ── source toggles ──────────────────────────────────────────────── */

export function SourceToggles({
  sources,
  active,
  onChange,
}: {
  sources: SourceId[];
  active: SourceId[];
  onChange: (next: SourceId[]) => void;
}) {
  function toggle(id: SourceId) {
    if (active.includes(id)) {
      const next = active.filter((s) => s !== id);
      onChange(next.length > 0 ? next : [id]);
    } else {
      onChange([...active, id]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((id) => (
        <FilterPill key={id} active={active.includes(id)} onClick={() => toggle(id)}>
          {SOURCE_LABELS[id]}
        </FilterPill>
      ))}
    </div>
  );
}

/* ── comps table ─────────────────────────────────────────────────── */

function ConditionChip({ condition }: { condition: string }) {
  const label =
    CONDITION_LABELS[condition as Condition] ?? condition.replace("_", " ");
  return (
    <span className="inline-flex rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium capitalize text-[var(--muted)]">
      {label}
    </span>
  );
}

function EvidenceChip({ kind }: { kind: CompRow["evidenceKind"] }) {
  const label = evidenceLabel(kind);
  const tone =
    kind === "confirmed_sale"
      ? "border-emerald-500/30 text-emerald-400"
      : kind === "active_ask"
        ? "border-amber-500/30 text-amber-400"
        : "border-[var(--border)] text-[var(--muted)]";
  return (
    <span
      className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${tone}`}
      title={label}
    >
      {label}
    </span>
  );
}

export function CompsTable({ comps }: { comps: CompRow[] }) {
  if (comps.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--muted)]">
        No comps match selected filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--border)] text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
            <th className="px-2 py-2.5 font-medium">Date</th>
            <th className="px-2 py-2.5 font-medium">Source</th>
            <th className="px-2 py-2.5 font-medium text-right">Price</th>
            <th className="px-2 py-2.5 font-medium">Condition</th>
            <th className="px-2 py-2.5 font-medium">Match</th>
            <th className="px-2 py-2.5 font-medium">Evidence</th>
            <th className="px-2 py-2.5 font-medium text-center">Mark</th>
            <th className="px-2 py-2.5 font-medium">Listing</th>
          </tr>
        </thead>
        <tbody>
          {comps.map((c) => (
            <tr
              key={c.id}
              className={`border-b border-[var(--border)]/50 transition-colors hover:bg-white/[0.02] ${
                c.inOracleMark ? "" : "opacity-70"
              }`}
            >
              <td className="whitespace-nowrap px-2 py-2.5 tabular-nums text-[var(--muted)]">
                {formatTableDate(c.observedAt)}
              </td>
              <td className="whitespace-nowrap px-2 py-2.5 text-[var(--muted)]">
                {SOURCE_LABELS[c.source]}
              </td>
              <td className="whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums">
                {c.displayCurrency === "JPY" ? "¥" : "NT$"}
                {c.displayPrice.toLocaleString("ja-JP")}
              </td>
              <td className="px-2 py-2.5">
                <ConditionChip condition={c.condition} />
              </td>
              <td className="whitespace-nowrap px-2 py-2.5 text-[var(--muted)]">
                {c.matchMethod ? (
                  <span title={`${MATCH_METHOD_LABELS[c.matchMethod]} · ${((c.matchConfidence ?? 0) * 100).toFixed(0)}%`}>
                    {MATCH_METHOD_LABELS[c.matchMethod]}
                    {c.matchConfidence != null && (
                      <span className="ml-1 tabular-nums opacity-70">
                        {(c.matchConfidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="opacity-40">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-2 py-2.5">
                <EvidenceChip kind={c.evidenceKind} />
              </td>
              <td className="px-2 py-2.5 text-center">
                {c.inOracleMark ? (
                  <span className="text-[var(--accent)]" title="Included in Oracle Value median">
                    ✓
                  </span>
                ) : (
                  <span className="text-[var(--muted)] opacity-40" title="Display only — not in median">
                    —
                  </span>
                )}
              </td>
              <td className="max-w-[200px] truncate px-2 py-2.5 sm:max-w-xs">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] hover:underline"
                  title={c.title}
                >
                  {c.title}
                  <span className="ml-1 opacity-50" aria-hidden>
                    ↗
                  </span>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
