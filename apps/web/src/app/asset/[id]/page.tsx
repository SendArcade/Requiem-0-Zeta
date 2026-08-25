import { notFound } from "next/navigation";
import { AssetPageClient } from "@/components/AssetPageClient";
import { getAssetData } from "@/lib/data";
import { hasPublishedMark } from "@/lib/published-mark";
import { isOnWatchlist } from "@/lib/watchlist-db";
import { parseConditionsParam, parseSourcesParam } from "@/lib/watchlist";

export default async function AssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sources?: string; conditions?: string }>;
}) {
  const { id } = await params;
  const { sources: sourcesParam, conditions: conditionsParam } = await searchParams;
  const sources = parseSourcesParam(sourcesParam ?? null);
  const conditions = parseConditionsParam(conditionsParam ?? null);
  const data = await getAssetData(id, sources, "JPY", conditions);
  if (!data) notFound();

  const oracle = data.oracle;
  if (
    !oracle ||
    !hasPublishedMark({ nComps: oracle.nComps, confidence: oracle.confidence })
  ) {
    notFound();
  }

  const inWatchlist = await isOnWatchlist(id);

  return (
    <AssetPageClient
      initial={data}
      initialSources={sources}
      initialConditions={conditions}
      inWatchlist={inWatchlist}
    />
  );
}
