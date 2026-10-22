import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const existing = request.cookies.get("beyoracle_session")?.value;
  const newSession = existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing) ? null : crypto.randomUUID();
  const headers = new Headers(request.headers);
  if (newSession) {
    const cookies = (headers.get("cookie") || "").split(";").map(value => value.trim()).filter(value => value && value.split("=")[0] !== "beyoracle_session").join("; ");
    headers.set("cookie", `${cookies ? `${cookies}; ` : ""}beyoracle_session=${newSession}`);
  }
  const res = NextResponse.next({ request: { headers } });
  if (newSession) {
    res.cookies.set("beyoracle_session", newSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
