export const dynamic = "force-dynamic";

/** Liveness: deliberately independent of remote services. */
export function GET() {
  return Response.json({ status: "ok", revision: process.env.RAILWAY_GIT_COMMIT_SHA ?? null }, { headers: { "Cache-Control": "no-store" } });
}
