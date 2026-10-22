import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/** Fail closed in production; existing local tools remain available without a configured token. */
export function requireAdmin(req: Request): Response | null {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token && process.env.NODE_ENV !== "production") return null;
  if (!token) return NextResponse.json({ error: "Admin API disabled" }, { status: 403 });
  const actual = Buffer.from(req.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${token}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
