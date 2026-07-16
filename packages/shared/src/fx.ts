import type { Currency } from "./index.js";

/** Static cross-rates — fallback when historical FX unavailable. */
export const FX_RATES: Record<Currency, Record<Currency, number>> = {
  JPY: { JPY: 1, TWD: 0.197, USD: 0.0067 },
  TWD: { JPY: 5.08, TWD: 1, USD: 0.032 },
  USD: { JPY: 149, TWD: 31.2, USD: 1 },
};

export function getStaticFxRate(from: Currency, to: Currency): number {
  if (from === to) return 1;
  return FX_RATES[from][to];
}

export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  return Math.round(amount * getStaticFxRate(from, to) * 100) / 100;
}

/** FX rate from `from` → `to` at `date` (Frankfurter when online, static fallback). */
export async function fetchFxRateAtDate(
  from: Currency,
  to: Currency,
  date: Date
): Promise<number> {
  if (from === to) return 1;

  const day = date.toISOString().slice(0, 10);
  const pair = `${from}_${to}`;

  try {
    const url = `https://api.frankfurter.app/${day}?from=${from}&to=${to}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const json = (await res.json()) as { rates?: Record<string, number> };
    const rate = json.rates?.[to];
    if (rate && rate > 0) return rate;
  } catch {
    // fall through to static stub
  }

  return getStaticFxRate(from, to);
}
