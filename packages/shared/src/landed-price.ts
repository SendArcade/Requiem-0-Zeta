import type { Currency, SourceId } from "./index.js";
import { convertCurrency, fetchFxRateAtDate, getStaticFxRate } from "./fx.js";

/** Typical buyer shipping add-on when listing price excludes freight (Shopee TW). */
export const DEFAULT_SHIPPING_TWD = 60;

export interface LandedPriceInput {
  source: SourceId;
  price: number;
  currency: Currency;
  observedAt: Date;
  rawJson?: Record<string, unknown>;
}

export interface LandedPriceResult {
  landedJpy: number;
  fxRateAtSale: number;
  shippingJpy: number;
}

function shippingFromRaw(raw: Record<string, unknown> | undefined): number | null {
  if (!raw) return null;
  const ship = raw.shippingTwd ?? raw.shipping_twd ?? raw.shipping;
  if (typeof ship === "number" && ship >= 0) return ship;
  return null;
}

/** Estimate buyer shipping in listing currency (0 when price is all-in). */
export function estimateShippingAmount(
  source: SourceId,
  currency: Currency,
  rawJson?: Record<string, unknown>
): number {
  const fromRaw = shippingFromRaw(rawJson);
  if (fromRaw != null) return fromRaw;

  if (source === "shopee_tw" && currency === "TWD") {
    return DEFAULT_SHIPPING_TWD;
  }

  // Mercari / Yahoo JP list prices typically include domestic shipping.
  return 0;
}

function asFiniteNumber(n: unknown, fallback = 0): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

/** Sync landed JPY using static FX (oracle hot path + fixtures). */
export function computeLandedJpySync(input: LandedPriceInput): LandedPriceResult {
  const price = asFiniteNumber(input.price);
  const shipping = asFiniteNumber(
    estimateShippingAmount(input.source, input.currency, input.rawJson)
  );
  const fxRateAtSale =
    input.currency === "JPY" ? 1 : getStaticFxRate(input.currency, "JPY");

  const itemJpy =
    input.currency === "JPY"
      ? price
      : Math.round(price * fxRateAtSale * 100) / 100;

  const shippingJpy =
    input.currency === "JPY"
      ? shipping
      : Math.round(shipping * fxRateAtSale * 100) / 100;

  return {
    landedJpy: Math.round((itemJpy + shippingJpy) * 100) / 100,
    fxRateAtSale,
    shippingJpy,
  };
}

/** Async landed JPY with historical FX at time of sale (ingest persist). */
export async function computeLandedJpy(input: LandedPriceInput): Promise<LandedPriceResult> {
  const price = asFiniteNumber(input.price);
  const shipping = asFiniteNumber(
    estimateShippingAmount(input.source, input.currency, input.rawJson)
  );

  if (input.currency === "JPY") {
    return {
      // Coerce price: Mercari raw may pass string; `"1000"+0` → `"10000"` (10× bug).
      landedJpy: Math.round((price + shipping) * 100) / 100,
      fxRateAtSale: 1,
      shippingJpy: shipping,
    };
  }

  const fxRateAtSale = await fetchFxRateAtDate(input.currency, "JPY", input.observedAt);
  const itemJpy = Math.round(price * fxRateAtSale * 100) / 100;
  const shippingJpy = Math.round(shipping * fxRateAtSale * 100) / 100;

  return {
    landedJpy: Math.round((itemJpy + shippingJpy) * 100) / 100,
    fxRateAtSale,
    shippingJpy,
  };
}

/** Resolve comp price in JPY — prefer stored landed, else convert raw. */
export function resolveCompPriceJpy(comp: {
  price: number;
  currency: Currency;
  landedJpy?: number | null;
}): number {
  if (comp.landedJpy != null && comp.landedJpy > 0) return comp.landedJpy;
  return convertCurrency(comp.price, comp.currency, "JPY");
}
