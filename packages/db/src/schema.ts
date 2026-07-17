import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const generationEnum = pgEnum("generation", ["plastic", "metal", "burst", "x"]);
export const skuTypeEnum = pgEnum("sku_type", [
  "sealed",
  "starter",
  "complete_loose",
  "complete_sealed",
]);
export const sourceEnum = pgEnum("source", [
  "mercari_jp",
  "shopee_tw",
  "yahoo_auctions_jp",
  "ruten_tw",
  "mandarake_jp",
  "suruga_ya_jp",
  "ebay_com",
]);
export const conditionEnum = pgEnum("condition", ["sealed", "like_new", "used", "unknown"]);
export const observationStatusEnum = pgEnum("observation_status", ["listing", "sold"]);
export const matchMethodEnum = pgEnum("match_method", [
  "product_code",
  "alias_exact",
  "alias_fuzzy",
  "manual",
]);
export const matchReviewStatusEnum = pgEnum("match_review_status", [
  "pending",
  "approved",
  "rejected",
]);
export const localeEnum = pgEnum("locale", ["en", "ja", "zh"]);
export const confidenceEnum = pgEnum("oracle_confidence", ["high", "medium", "low"]);

export const parts = pgTable(
  "parts",
  {
    id: text("id").primaryKey(),
    generation: generationEnum("generation").notNull(),
    partType: text("part_type").notNull(),
    nameEn: text("name_en").notNull(),
    nameJp: text("name_jp"),
    nameZh: text("name_zh"),
    productCodes: jsonb("product_codes").$type<string[]>().notNull().default([]),
    attrs: jsonb("attrs").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("parts_generation_idx").on(t.generation)]
);

export const aliases = pgTable(
  "aliases",
  {
    id: text("id").primaryKey(),
    partId: text("part_id")
      .notNull()
      .references(() => parts.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    text: text("text").notNull(),
    source: text("source").notNull().default("catalog"),
  },
  (t) => [
    index("aliases_part_id_idx").on(t.partId),
    index("aliases_text_idx").on(t.text),
  ]
);

export const observations = pgTable(
  "observations",
  {
    id: text("id").primaryKey(),
    source: sourceEnum("source").notNull(),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    price: real("price").notNull(),
    currency: text("currency").notNull(),
    status: observationStatusEnum("status").notNull(),
    condition: conditionEnum("condition").notNull().default("unknown"),
    url: text("url").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    rawJson: jsonb("raw_json").$type<Record<string, unknown>>().notNull().default({}),
    landedJpy: real("landed_jpy"),
    fxRateAtSale: real("fx_rate_at_sale"),
    shippingJpy: real("shipping_jpy"),
    isBundle: boolean("is_bundle").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("observations_source_external_idx").on(t.source, t.externalId),
    index("observations_observed_at_idx").on(t.observedAt),
    index("observations_is_bundle_idx").on(t.isBundle),
  ]
);

export const saleEvents = pgTable(
  "sale_events",
  {
    id: text("id").primaryKey(),
    observationId: text("observation_id").notNull(),
    partId: text("part_id"),
    productId: text("product_id"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("sale_events_observation_id_idx").on(t.observationId),
    index("sale_events_created_at_idx").on(t.createdAt),
  ]
);

export const matches = pgTable(
  "matches",
  {
    id: text("id").primaryKey(),
    observationId: text("observation_id")
      .notNull()
      .references(() => observations.id, { onDelete: "cascade" }),
    partId: text("part_id")
      .notNull()
      .references(() => parts.id, { onDelete: "cascade" }),
    confidence: real("confidence").notNull(),
    method: matchMethodEnum("method").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("matches_part_id_idx").on(t.partId),
    index("matches_observation_id_idx").on(t.observationId),
  ]
);

export const oracleSnapshots = pgTable(
  "oracle_snapshots",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => parts.id, { onDelete: "cascade" }),
    sourcesMask: integer("sources_mask").notNull(),
    value: real("value").notNull(),
    low: real("low").notNull(),
    high: real("high").notNull(),
    ciLow: real("ci_low"),
    ciHigh: real("ci_high"),
    nComps: integer("n_comps").notNull(),
    asOf: timestamp("as_of", { withTimezone: true }).notNull(),
    currency: text("currency").notNull(),
    confidence: confidenceEnum("confidence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("oracle_snapshots_asset_id_idx").on(t.assetId),
    uniqueIndex("oracle_snapshots_asset_mask_idx").on(t.assetId, t.sourcesMask),
  ]
);

export const watchlist = pgTable(
  "watchlist",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    partId: text("part_id")
      .notNull()
      .references(() => parts.id, { onDelete: "cascade" }),
    /** Oracle mark when the part was added — baseline for drop alerts. */
    baselineValue: real("baseline_value"),
    alertThresholdPct: real("alert_threshold_pct").notNull().default(10),
    lastAlertAt: timestamp("last_alert_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("watchlist_session_part_idx").on(t.sessionId, t.partId),
    index("watchlist_session_id_idx").on(t.sessionId),
  ]
);

export const watchlistAlerts = pgTable(
  "watchlist_alerts",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    partId: text("part_id")
      .notNull()
      .references(() => parts.id, { onDelete: "cascade" }),
    previousValue: real("previous_value").notNull(),
    newValue: real("new_value").notNull(),
    dropPct: real("drop_pct").notNull(),
    thresholdPct: real("threshold_pct").notNull(),
    read: integer("read").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("watchlist_alerts_session_idx").on(t.sessionId),
    index("watchlist_alerts_session_read_idx").on(t.sessionId, t.read),
  ]
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    generation: generationEnum("generation").notNull(),
    skuType: skuTypeEnum("sku_type").notNull(),
    nameEn: text("name_en").notNull(),
    nameJp: text("name_jp"),
    productCodes: jsonb("product_codes").$type<string[]>().notNull().default([]),
    attrs: jsonb("attrs").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("products_generation_idx").on(t.generation),
    index("products_sku_type_idx").on(t.skuType),
  ]
);

export const productParts = pgTable(
  "product_parts",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    partId: text("part_id")
      .notNull()
      .references(() => parts.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("product_parts_part_id_idx").on(t.partId),
    primaryKey({ columns: [t.productId, t.partId] }),
  ]
);

export const matchReviewQueue = pgTable(
  "match_review_queue",
  {
    id: text("id").primaryKey(),
    observationId: text("observation_id")
      .notNull()
      .references(() => observations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    suggestedPartId: text("suggested_part_id").references(() => parts.id, {
      onDelete: "set null",
    }),
    suggestedProductId: text("suggested_product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    confidence: real("confidence").notNull(),
    method: matchMethodEnum("method").notNull(),
    status: matchReviewStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("match_review_queue_status_idx").on(t.status),
    index("match_review_queue_observation_id_idx").on(t.observationId),
  ]
);

export const productMatches = pgTable(
  "product_matches",
  {
    id: text("id").primaryKey(),
    observationId: text("observation_id")
      .notNull()
      .references(() => observations.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    confidence: real("confidence").notNull(),
    method: matchMethodEnum("method").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("product_matches_product_id_idx").on(t.productId),
    index("product_matches_observation_id_idx").on(t.observationId),
  ]
);

export const productOracleSnapshots = pgTable(
  "product_oracle_snapshots",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sourcesMask: integer("sources_mask").notNull(),
    value: real("value").notNull(),
    low: real("low").notNull(),
    high: real("high").notNull(),
    ciLow: real("ci_low"),
    ciHigh: real("ci_high"),
    nComps: integer("n_comps").notNull(),
    asOf: timestamp("as_of", { withTimezone: true }).notNull(),
    currency: text("currency").notNull(),
    confidence: confidenceEnum("confidence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("product_oracle_snapshots_product_id_idx").on(t.productId),
    uniqueIndex("product_oracle_snapshots_product_mask_idx").on(
      t.productId,
      t.sourcesMask
    ),
  ]
);

export const partsRelations = relations(parts, ({ many }) => ({
  aliases: many(aliases),
  matches: many(matches),
  oracleSnapshots: many(oracleSnapshots),
  productParts: many(productParts),
}));

export const aliasesRelations = relations(aliases, ({ one }) => ({
  part: one(parts, { fields: [aliases.partId], references: [parts.id] }),
}));

export const observationsRelations = relations(observations, ({ many }) => ({
  matches: many(matches),
  productMatches: many(productMatches),
  reviewQueue: many(matchReviewQueue),
}));

export const matchReviewQueueRelations = relations(matchReviewQueue, ({ one }) => ({
  observation: one(observations, {
    fields: [matchReviewQueue.observationId],
    references: [observations.id],
  }),
  suggestedPart: one(parts, {
    fields: [matchReviewQueue.suggestedPartId],
    references: [parts.id],
  }),
  suggestedProduct: one(products, {
    fields: [matchReviewQueue.suggestedProductId],
    references: [products.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  observation: one(observations, {
    fields: [matches.observationId],
    references: [observations.id],
  }),
  part: one(parts, { fields: [matches.partId], references: [parts.id] }),
}));

export const oracleSnapshotsRelations = relations(oracleSnapshots, ({ one }) => ({
  part: one(parts, { fields: [oracleSnapshots.assetId], references: [parts.id] }),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  part: one(parts, { fields: [watchlist.partId], references: [parts.id] }),
}));

export const watchlistAlertsRelations = relations(watchlistAlerts, ({ one }) => ({
  part: one(parts, { fields: [watchlistAlerts.partId], references: [parts.id] }),
}));

export const ingestRunStatusEnum = ["running", "success", "failed"] as const;
export type IngestRunStatus = (typeof ingestRunStatusEnum)[number];

export const ingestRuns = pgTable(
  "ingest_runs",
  {
    id: text("id").primaryKey(),
    jobName: text("job_name").notNull(),
    sourceId: text("source_id"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    status: text("status").notNull().$type<IngestRunStatus>(),
    stats: jsonb("stats").$type<Record<string, unknown>>().notNull().default({}),
    errors: jsonb("errors").$type<string[]>().notNull().default([]),
  },
  (t) => [
    index("ingest_runs_started_at_idx").on(t.startedAt),
    index("ingest_runs_job_name_idx").on(t.jobName),
  ]
);
