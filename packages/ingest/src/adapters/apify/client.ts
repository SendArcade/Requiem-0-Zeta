/**
 * Thin Apify REST client — no npm dependency.
 * Pattern: tcg_mcp PricingSource provider swap + Apify run-sync-get-dataset-items.
 * @see docs/INGEST_STANDARDS.md
 */

const APIFY_API_BASE = "https://api.apify.com/v2";

export class ApifyError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApifyError";
  }
}

export interface ApifyRunSyncOpts {
  /** Dataset item cap returned by the sync endpoint (not actor input). */
  datasetLimit?: number;
  timeoutMs?: number;
}

/** Actor store id `user/name` → REST id `user~name`. */
export function apifyActorRestId(storeId: string): string {
  return storeId.includes("~") ? storeId : storeId.replace("/", "~");
}

export function apifyToken(): string | undefined {
  const token = process.env.APIFY_TOKEN?.trim();
  return token && token.length > 0 ? token : undefined;
}

export function apifyConfigured(): boolean {
  return apifyToken() !== undefined;
}

/**
 * Run an Actor synchronously and return default-dataset items.
 * Blocks up to ~300s on Apify's side; we add a local fetch timeout on top.
 */
export async function runActorSyncGetItems<T = Record<string, unknown>>(
  actorStoreId: string,
  input: Record<string, unknown>,
  opts: ApifyRunSyncOpts = {}
): Promise<T[]> {
  const token = apifyToken();
  if (!token) {
    throw new ApifyError("APIFY_TOKEN is not set", 401);
  }

  const actorId = apifyActorRestId(actorStoreId);
  const params = new URLSearchParams({
    token,
    format: "json",
    clean: "1",
  });
  if (opts.datasetLimit !== undefined) {
    params.set("limit", String(opts.datasetLimit));
  }

  const timeoutMs = opts.timeoutMs ?? Number(process.env.APIFY_TIMEOUT_MS ?? 330_000);
  const url = `${APIFY_API_BASE}/acts/${actorId}/run-sync-get-dataset-items?${params}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ApifyError(
      `Apify actor ${actorStoreId} failed with ${res.status}: ${body.slice(0, 300)}`,
      res.status
    );
  }

  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) {
    throw new ApifyError(
      `Apify actor ${actorStoreId} returned non-array dataset`,
      502
    );
  }

  return json as T[];
}

/** Parse MERCARI_LIVE_PROVIDER / YAHOO_LIVE_PROVIDER comma chains. */
export function parseLiveProviderChain(
  envValue: string | undefined,
  defaults: { primary: string; fallback?: string }
): string[] {
  const raw = envValue?.trim();
  if (!raw) {
    const chain = [defaults.primary];
    if (defaults.fallback && apifyConfigured()) chain.push(defaults.fallback);
    return chain;
  }

  return raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}
