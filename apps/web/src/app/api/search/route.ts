import { withApiErrors } from "@/lib/api-input";
import { NextResponse } from "next/server";
import { searchUnified } from "@/lib/data";

export const GET = withApiErrors(async (req: Request) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length > 200) return NextResponse.json({ error: "Search query too long" }, { status: 400 });
  const results = q ? await searchUnified(q) : [];
  return NextResponse.json({ results });
});
