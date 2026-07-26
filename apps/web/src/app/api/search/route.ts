import { NextResponse } from "next/server";
import { searchUnified } from "@/lib/data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const results = q ? await searchUnified(q) : [];
  return NextResponse.json({ results });
}
