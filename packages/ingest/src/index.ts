export * from "./types.js";
export { MercariJpSource } from "./adapters/mercari-jp.js";
export {
  MercariClient,
  MercariRequestError,
  conditionFromMercariId,
  mercariItemUrl,
  type MercariItem,
  type MercariSearchPage,
} from "./adapters/mercari/client.js";
export { ShopeeTwSource } from "./adapters/shopee-tw.js";
export { ShopeeAccessError, ShopeeClient } from "./adapters/shopee/client.js";
export { YahooAuctionsJpSource } from "./adapters/yahoo-auctions-jp.js";
export { EbayComSource } from "./adapters/ebay-com.js";
export {
  YahooAuctionsClient,
  YahooRequestError,
  conditionFromYahoo,
  parseNextData,
  yahooItemUrl,
  type YahooItem,
  type YahooSearchPage,
} from "./adapters/yahoo-auctions/client.js";
export { getSources, ingestFromSource, ingestFixturesSmoke } from "./pipeline.js";
export { runScheduledIngest, SCHEDULED_INGEST_QUERIES, buildIngestQueryPlan, runSourceIngest, listEnabledSources } from "./scheduled.js";
export { backfillLandedJpy } from "./backfill-landed.js";
export { buildBackfillQueryPlan } from "./backfill-query-plan.js";
export {
  buildProductBackfillQueryPlan,
  buildProductBackfillTargets,
  listPublishableProducts,
  PRIORITY_PRODUCT_IDS,
} from "./product-backfill-query-plan.js";
export {
  runProductBackfill,
  shouldRunProductBackfill,
  listProductBackfillSources,
  PRODUCT_BACKFILL_JOB,
} from "./product-backfill.js";
export type { ProductBackfillReport } from "./product-backfill.js";
export {
  hashProductId,
  productShardIndex,
  parseShardCount,
  parseShardId,
  listProductsForShard,
  buildShardQueryPlan,
  assertShardPartition,
  runProductBackfillShard,
  buildProductBackfillShardJobs,
  PRODUCT_BACKFILL_SHARD_JOB,
  DEFAULT_PRODUCT_BACKFILL_SHARD_COUNT,
} from "./product-backfill-shards.js";
export type {
  ProductBackfillShardReport,
  ProductShardTarget,
} from "./product-backfill-shards.js";
export {
  runOracleBackfill,
  backfillFixtureComps,
  recomputeAllOracleSnapshots,
  shouldRunOracleBackfill,
  ORACLE_BACKFILL_JOB,
  isBackfillInFlight,
} from "./backfill-oracle.js";
export {
  startIngestRun,
  getLastSuccessfulIngestRun,
  sweepStaleIngestRuns,
  isRunningIngestRunStale,
  ingestRunStaleMs,
  DEFAULT_INGEST_RUN_STALE_MS,
} from "./runs.js";
export {
  persistIngestBatch,
  persistObservation,
  recomputeOracleSnapshot,
  recomputeOracleSnapshotsBatch,
  fetchRecentSales,
} from "./persist.js";

export { registerOracleRecomputeEnqueuer, deferOracleRecomputeEnabled, getOracleRecomputeEnqueuer } from "./oracle-recompute.js";

export { approveReviewQueueItem, rejectReviewQueueItem } from "./review-queue.js";
export { fetchSaleEventsSince, fetchRecentProductSales } from "./persist.js";
export { purgeBadComps, isStaleOrWrongMatch } from "./purge-bad-comps.js";
export type { PurgeBadCompsOptions, PurgeBadCompsResult } from "./purge-bad-comps.js";
export { runBurstWave0Maintenance } from "./burst-wave0-maintenance.js";
export type { BurstWave0MaintenanceReport } from "./burst-wave0-maintenance.js";
export { verifyWave0, formatWave0Verify } from "./burst-wave0-verify-lib.js";
export type { Wave0VerifyReport } from "./burst-wave0-verify-lib.js";
