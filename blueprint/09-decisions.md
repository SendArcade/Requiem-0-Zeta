# 09 — Decision log

[← Blueprint index](README.md) · Prev: [08-glossary](08-glossary.md) · Next: [10-roadmap](10-roadmap.md)

Why things are the way they are. Append new entries; do not rewrite old ones.
If you reverse a decision, add a new entry that supersedes it.

---

### D1 — Oracle only for v1, no marketplace or social

**Date:** 2026-07-28 · **Status:** active

Considered a full community hub (battle maps, tournaments, chat) in the style
of BeybladeHub and 321GoShoot. Rejected for v1.

Valuation quality is the hard, defensible problem, and social features would
compete directly with incumbents who already have community liquidity. Nobody
returns for a mark they do not trust, so trust is the only thing worth building
first. See [01-thesis](01-thesis.md).

---

### D2 — Dual corridor from day one (Mercari JP + Shopee TW)

**Date:** 2026-07-28 · **Status:** active

A single corridor would have been simpler. Rejected because the two markets
price differently and price discovery across them is the actual product
insight. Building for two from the start forced the source-mask abstraction to
be real rather than retrofitted.

Cost: double the ingest surface before either is proven.

---

### D3 — All generations, not X only

**Date:** 2026-07-28 · **Status:** active

X has the most liquidity, but Plastic, Metal Fight, and Burst carry collector
value and older parts are exactly where price opacity is worst. The taxonomy
had to be generation-keyed rather than X-shaped, which is far cheaper to do at
the start than to retrofit.

Cost: sparser comps per part, so confidence gating matters more.

---

### D4 — Scavenge before building

**Date:** 2026-07-28 · **Status:** active · **Rule:** [.cursor/rules/scavenge-first.mdc](../.cursor/rules/scavenge-first.mdc)

Provider interface from tcg_mcp, layered architecture and cascading matcher
from PokeDao, ALT and Card Ladder for product shape.

Notably, we did **not** fork a generalized oracle, because none exists that
covers multi-generation Beyblade taxonomy, JP/TW sold comps, and user-selectable
source masks. Community databases are catalog seeds; Apify actors are ingest
building blocks. Neither is the product. Recorded in
[docs/ATTRIBUTIONS.md](../docs/ATTRIBUTIONS.md).

---

### D5 — Fixture-first, live paths env-gated

**Date:** 2026-07-28 · **Status:** active

Every adapter ships fixtures and reads them by default; live paths need an env
var and fall back to fixtures on failure.

CI must never depend on a marketplace being reachable, and a contributor with
no API access must be able to run the whole stack. The cost is that fixtures
drift from reality — which is precisely how the 1.5% match rate stayed hidden
until the live probe ran. **Fixtures validate plumbing, not accuracy.**

---

### D6 — Median plus IQR rather than a learned model

**Date:** 2026-07-28 · **Status:** active

ALT uses ML for its mark. We start with a robust median.

With sparse comps and no labelled data, a median is defensible, explainable,
and debuggable, and explainability is the trust story. Revisit once we have
volume. Upgrade path in [07-oracle-value](07-oracle-value.md).

---

### D7 — Direct Mercari DPoP rather than a paid parser

**Date:** 2026-07-28 · **Status:** active

Options were an Apify actor, a commercial parser like ShopAPIS, or Mercari's
public search endpoint with a self-signed DPoP proof.

Chose DPoP: no account, no token, no per-call cost, and verified working
against live data. The interface keeps a paid provider as a drop-in fallback if
the endpoint hardens. Throttled to 1.2s minimum interval as a courtesy.

Risk accepted: an unauthenticated public endpoint can change without notice.
Mitigated by fixture fallback and by isolating it behind `PricingSource`.

---

### D8 — Defer BullMQ, Redis, and Postgres in the read path

**Date:** 2026-07-28 · **Status:** active

The plan called for job queues and a caching layer. Shipped without them:
ingest is CLI-driven and the web app reads catalog and fixtures from JSON, so
the UI runs with no database at all.

Correctness of matching and valuation is the bottleneck, not throughput.
Scheduling infrastructure would only automate the production of wrong numbers.
Add once accuracy is fixed.

---

### D9 — Bundle filtering ships with the matcher fix, not before

**Date:** 2026-07-28 · **Status:** active

`looksLikeBundle()` exists and is tested, but nothing filters on it.

Today no bundles match, because matching is too broken to admit them, so
filtering would be a no-op. The moment accuracy improves, ~38% of comps become
multi-item lots. Coupling the two changes means the poisoning window never
opens. Detail in [06-matching](06-matching.md).

---

### D10 — Blueprint as the agent entrypoint

**Date:** 2026-07-28 · **Status:** active

Context was spread across `AGENTS.md`, `docs/`, and chat history, so a fresh
session could not find the critical matcher defect. `blueprint/` is now the
canonical navigational spine, with `docs/` holding long-form research and
running state.

Keep the blueprint small and interlinked. Long research belongs in `docs/`.

---

### D11 — Whole Beyblade as primary asset (supersedes part-first thesis)

**Date:** 2026-08-03 · **Status:** active · **Supersedes:** part-first framing in
[01-thesis](01-thesis.md) (2026-07-28)

Part-level public marks fit Beyblade X competitive tuning but miss how most
liquidity lists: complete tops, starter sets, special packages, and mint boxes
— especially on eBay and across all generations.

**Decision:** Publish Oracle Value on **whole Beyblade products**, graded as one
unit (complete loose, mint box, sealed set). Do **not** derive the public mark
from summing part medians. Keep part-level observations and BOM data **inside
the pricing engine** for validation and future decomposition.

**Generation coverage:** Plastic, Metal Fight, Burst, and Beyblade X at **equal
weight** — same catalog ambition, ingest aliases, and mark quality bar per gen.

**Cost:** Catalog schema needs a `products` layer (see [04-data-model](04-data-model.md));
matcher must **admit** complete-product listings we currently reject as
starters/bundles, while still rejecting multi-SKU lots.

---

See also: [01-thesis](01-thesis.md) · [10-roadmap](10-roadmap.md)
