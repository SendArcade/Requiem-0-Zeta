import { NextResponse } from "next/server";

export class ApiInputError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

/** Bound JSON bodies before buffering; never return parser or database details to clients. */
export async function readJsonObject(req: Request): Promise<Record<string, unknown>> {
  const reader = req.body?.getReader();
  if (!reader) throw new ApiInputError("JSON object required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16_384) {
        await reader.cancel();
        throw new ApiInputError("Request body too large", 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let value: unknown;
  try { value = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new ApiInputError("Invalid JSON"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiInputError("JSON object required");
  return value as Record<string, unknown>;
}

export function validId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

export function validThreshold(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 100;
}

export function withApiErrors<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      const req = args[0];
      if (req instanceof Request && !["GET", "HEAD"].includes(req.method)) {
        const origin = req.headers.get("origin");
        if (origin && origin !== new URL(req.url).origin) throw new ApiInputError("Cross-origin mutation denied", 403);
      }
      const response = await handler(...args);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    catch (error) {
      if (error instanceof ApiInputError) return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
      console.error("[api] request failed", error instanceof Error ? error.name : "UnknownError");
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  };
}
