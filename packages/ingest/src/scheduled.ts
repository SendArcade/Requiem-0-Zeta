import type { SourceId } from "@beyoracle/shared";
import { buildIngestQueryPlan } from "./query-plan.js";
import { listEnabledSources, runSourceIngest } from "./source-ingest.js";

export interface ScheduledIngestOptions {
  queries?: string[];
  limitPerQuery?: number;
  sources?: SourceId[];
}

export interface ScheduledIngestReport {
  queriesRun: number;
  listingsFetched: number;
  compEligible: number;
  inserted: number;
  updated: number;
  matched: number;
  partsTouched: number;
  sourcesPolled: SourceId[];
  errors: string[];
}

/** Sequential all-source ingest — CLI / legacy path. Prefer cron.tick fan-out in worker. */
export async function runScheduledIngest(
  opts: ScheduledIngestOptions = {}
): Promise<ScheduledIngestReport> {
  const queries = opts.queries ?? buildIngestQueryPlan();
  const sources = opts.sources ?? listEnabledSources();

  const report: ScheduledIngestReport = {
    queriesRun: 0,
    listingsFetched: 0,
    compEligible: 0,
    inserted: 0,
    updated: 0,
    matched: 0,
    partsTouched: 0,
    sourcesPolled: sources,
    errors: [],
  };

  if (sources.length === 0) {
    report.errors.push(
      "No sources enabled — set MERCARI_API_ENABLED=1 and/or YAHOO_AUCTIONS_ENABLED=1, or INGEST_ALLOW_FIXTURES=1"
    );
    return report;
  }

  for (const sourceId of sources) {
    const result = await runSourceIngest({
      sourceId,
      queries,
      limitPerQuery: opts.limitPerQuery,
      recordRun: false,
    });
    report.queriesRun += result.queriesRun;
    report.listingsFetched += result.listingsFetched;
    report.compEligible += result.listingsFetched;
    report.inserted += result.inserted;
    report.updated += result.updated;
    report.matched += result.matched;
    report.partsTouched += result.partsTouched;
    report.errors.push(...result.errors);
  }

  return report;
}

export { SCHEDULED_INGEST_QUERIES } from "./queries.js";
export { buildIngestQueryPlan } from "./query-plan.js";
export { runSourceIngest, listEnabledSources } from "./source-ingest.js";
