# Beyoracle Blueprint — start here

This folder is the project's second brain. If you are an agent or a human
starting a fresh session, read this page first, then jump to the two or three
documents that match your task.

**Beyoracle in one sentence:** an ALT.xyz-style price oracle for **whole
Beyblades** (complete tops, sets, mint boxes) across all generations — with
part-level data inside the engine — built on sold comps from Japanese and
Taiwanese marketplaces, where the user chooses which sources feed the mark.

## Navigate by task

| If you are about to... | Read, in order |
|---|---|
| Understand why this project exists | [01-thesis](01-thesis.md) |
| Understand competitors and the market | [02-landscape](02-landscape.md) |
| Change how packages fit together | [03-architecture](03-architecture.md), [04-data-model](04-data-model.md) |
| Add or change a marketplace adapter | [05-sources](05-sources.md), [03-architecture](03-architecture.md) |
| Improve match accuracy | [06-matching](06-matching.md), [08-glossary](08-glossary.md) |
| Change how the mark is computed | [07-oracle-value](07-oracle-value.md), [04-data-model](04-data-model.md) |
| Read Japanese or Chinese listing text | [08-glossary](08-glossary.md) |
| Understand why something is the way it is | [09-decisions](09-decisions.md) |
| Pick up the next piece of work | [10-roadmap](10-roadmap.md) |
| Verify a change before claiming done | [11-verification](11-verification.md) |

## The single most important thing to know

**Matcher v2 shipped 2026-07-29.** Live probes now hit **27.8%** (Mercari) and
**48.0%** (Yahoo Auctions JP), up from 1.5% / 5.5%. Bundles are excluded before
comps reach the oracle. The pipeline is no longer fixture-only for JP sources,
but accuracy is still imperfect — read [06-matching](06-matching.md) before
claiming production-grade numbers.

## Map of the whole repo

```
apps/web/                 Next.js consumer UI, collector pages and pricing APIs
apps/worker/              BullMQ ingestion and recomputation worker
packages/pricing-service/ Shared pricing queries and persistence
packages/catalog-sync/    Runtime catalogue synchronization
tools/catalog-maintenance/ Catalogue generators, seed and sync CLI
packages/shared/          Types, generation taxonomy, FX, source bitmasks
packages/catalog/         Seed data (parts, aliases, fixtures) + loaders
packages/db/              Drizzle Postgres schema + migrations
packages/ingest/          PricingSource interface + Mercari JP / Shopee TW adapters
packages/oracle/          Cascading matcher + Oracle Value aggregation
blueprint/                This second brain
docs/                     Research output and running state
.cursor/rules/            Always-on engineering rules
```

## Companion documents outside the blueprint

These are long-form and change more often than the blueprint does.

| Document | What it holds |
|---|---|
| [docs/CURRENT_STATE.md](../docs/CURRENT_STATE.md) | What is shipped right now, env vars, known defects |
| [docs/SOURCE_MAP.md](../docs/SOURCE_MAP.md) | Full ranked research on every pricing and catalog source |
| [docs/MATCHING_RESEARCH.md](../docs/MATCHING_RESEARCH.md) | Matcher v3 roadmap from entity-resolution research |
| [docs/VALUATION_RESEARCH.md](../docs/VALUATION_RESEARCH.md) | Oracle v2 layers from robust-estimator research |
| [docs/ATTRIBUTIONS.md](../docs/ATTRIBUTIONS.md) | Borrowed patterns and their upstreams |
| [AGENTS.md](../AGENTS.md) | Short operational guide, commands, verify tiers |
| [.cursor/rules/scavenge-first.mdc](../.cursor/rules/scavenge-first.mdc) | Search for battle-tested code before writing new modules |

## House rules that bite

1. **Scavenge before building.** Search GitHub, Apify, and adjacent OSS first.
   Cite what you adapt in [docs/ATTRIBUTIONS.md](../docs/ATTRIBUTIONS.md).
2. **Never fake a mark.** If comps are sparse, say so. See
   [07-oracle-value](07-oracle-value.md) on confidence.
3. **Bundles are poison.** ~38% of real listings are multi-item lots. See
   [06-matching](06-matching.md).
4. **Live adapters stay env-gated** and fall back to fixtures, so CI never
   depends on a marketplace being reachable.
5. **Verify before claiming done.** See [11-verification](11-verification.md).
