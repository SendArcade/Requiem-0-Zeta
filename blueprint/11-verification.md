# 11 — Verification

[← Blueprint index](README.md) · Prev: [10-roadmap](10-roadmap.md)

Never claim done without running at least one relevant check, and say in your
summary which commands you ran.

## Tiers

| Tier | Command | When |
|---|---|---|
| Baseline | `pnpm typecheck && pnpm test` | Every change |
| Smoke | `pnpm ingest:fixtures` | Any ingest, matcher, or catalog change |
| Accuracy | `pnpm --filter @beyoracle/oracle eval:run` + live probes | Any matcher or catalog change |
| UI | `pnpm dev`, then load an asset page | Any web change |
| Build | `pnpm --filter @beyoracle/web build` | Before shipping web work |

## Baseline

```bash
pnpm typecheck   # all 6 packages
pnpm test        # 27 tests: 12 oracle matcher, 15 ingest
```

## Smoke

```bash
pnpm ingest:fixtures
# expected: { mercari: 12, shopee: 10, yahoo: 4, matched: 26 }
```

Runs the full ingest path against fixtures with no network. If these numbers
change, you altered the fixtures, the matcher, or the catalog — know which.

## Accuracy — the one that matters

```bash
MERCARI_API_ENABLED=1 pnpm --filter @beyoracle/ingest probe:mercari
```

Fetches real Mercari sold listings and reports match rate, bundle rate, method
breakdown, and unmatched samples. Takes about 20 seconds and makes live network
calls.

**Baseline as of 2026-07-29 (matcher v2):**

| Source | Listings | Matched | Rate | Bundles | Bundles matched |
|---|---|---|---|---|---|
| Mercari JP | 245 | 68 | **27.8%** | 99 (40.4%) | **0** |
| Yahoo Auctions JP | 200 | 96 | **48.0%** | 47 (23.5%) | **0** |

Previous baseline (pre-v2): Mercari **1.5%**, Yahoo **5.5%**. Any matcher or
catalog work must be measured against these figures and the new rate recorded.

```bash
YAHOO_AUCTIONS_ENABLED=1 pnpm --filter @beyoracle/ingest probe:yahoo
```

Pass a custom query to probe a specific part:

```bash
MERCARI_API_ENABLED=1 pnpm --filter @beyoracle/ingest probe:mercari "ベイブレードX ドランソード"
```

## Why fixtures are not enough

The fixture smoke test reports 26 of 26 matched — plumbing only. The live probe
reports 27.8% (Mercari). Both are correct; fixtures prove ingest + matcher
wiring, not real-world accuracy.

**Fixtures validate plumbing. Only the probe validates accuracy.** Any claim
about match quality that cites the smoke test is wrong.

## Manual check

```bash
pnpm dev   # http://localhost:3000
```

Open `/asset/x-bx-01-blade`, toggle Mercari and Shopee, and confirm the mark
changes. It should recompute from stored comps with no refetch — see
[07-oracle-value](07-oracle-value.md).

## Before shipping

- [ ] `pnpm typecheck` clean
- [ ] `pnpm test` passing
- [ ] `pnpm ingest:fixtures` unchanged, or the change is explained
- [ ] Probe re-run and new match rate reported, if matcher or catalog changed
- [ ] No live-network dependency added to a test
- [ ] Adapter changes keep the fixture fallback intact
- [ ] [docs/CURRENT_STATE.md](../docs/CURRENT_STATE.md) updated if behaviour changed
- [ ] Borrowed code cited in [docs/ATTRIBUTIONS.md](../docs/ATTRIBUTIONS.md)

## Environment

Node ≥ 20, pnpm 9.15.4, Homebrew toolchain at `/opt/homebrew/bin`.

Live ingest env vars are documented in
[docs/CURRENT_STATE.md](../docs/CURRENT_STATE.md). Note that `.env.example` is
covered by ignore rules, so the `MERCARI_*` variables must be copied across by
hand.

---

See also: [06-matching](06-matching.md) · [10-roadmap](10-roadmap.md) · [AGENTS.md](../AGENTS.md)
