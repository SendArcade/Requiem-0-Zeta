import { withApiErrors } from "@/lib/api-input";
import { NextResponse } from "next/server";
import { getProductData } from "@/lib/product-data";
import { parseConditionsParam, parseSourcesParam } from "@/lib/watchlist";

export const GET = withApiErrors(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const url = new URL(req.url);
  const sources = parseSourcesParam(url.searchParams.get("sources"));
  // Omitted filters must preserve the product SKU's own condition pool.
  const rawConditions = url.searchParams.get("conditions");
  const conditions = rawConditions ? parseConditionsParam(rawConditions) : undefined;
  const data = await getProductData(id, sources, "JPY", conditions);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
});
