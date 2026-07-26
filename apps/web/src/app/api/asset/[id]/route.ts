import { NextResponse } from "next/server";
import { getAssetData } from "@/lib/data";
import { parseConditionsParam, parseSourcesParam } from "@/lib/watchlist";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(_req.url);
  const sources = parseSourcesParam(url.searchParams.get("sources"));
  const conditions = parseConditionsParam(url.searchParams.get("conditions"));
  const data = await getAssetData(id, sources, "JPY", conditions);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
