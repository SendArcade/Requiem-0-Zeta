export {
  matchTitle,
  matchObservation,
  matchToProduct,
  extractProductCodes,
  canonicalizeProductCode,
  type MatchCandidate,
  type MatcherContext,
  type ProductMatchCandidate,
  type ProductMatcherContext,
} from "./matcher.js";
export { runProductEval, type ProductEvalCase, type ProductEvalReport } from "./product-eval.js";
export {
  computeOracleValue,
  computeProductOracleValue,
  resolveProductOracleWindowDays,
  computeOracleByCondition,
  recomputeWithSources,
  buildTimeSeries,
  filterComps,
  type CompInput,
  type OracleOptions,
  type OracleContext,
} from "./oracle-value.js";
export { buildOracleContext, cohortCompsMap } from "./oracle-context.js";
export {
  buildCohortIndex,
  adjustPriceToAsOf,
  cohortKeyForPart,
  type CohortIndex,
  type IndexSale,
} from "./cohort-index.js";
export { shrinkTowardPrior } from "./shrinkage.js";
export { estimateRegionPremium, buildRegionEstimates } from "./region.js";
