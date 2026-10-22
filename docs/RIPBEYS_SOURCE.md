# RIPBEYS source

The RIPBEYS Notion page was pasted on 2026-09-30. Title: ripbeys.io. Pricing, Seed inventory, and Grading are named as subpages and were not included. Their contents are still unknown.

## What the page claims

Beyblade’s primary business is in a mainstream wave. The online and onchain collectibles layer is near zero. The page treats that as the same gap ALT, PSA, and vault marketplaces filled for TCG after the boom.

It compares TCG scale (about $15.8B trading cards, Pokémon retail, online share, grading, tokenized card volume) with Beyblade X (30M+ units shipped by April 2025, no published secondary TAM, fragmented C2C, no unified price index). It cites Circana, Takara Tomy, and TOMY’s fiscal 2024 report for mainstream demand, and Taiwan resale (UX-03 Wizard Rod, queues, spend, fraud cases) as a leading indicator of an unpriced gray market.

The page does not claim Beyblade becomes Pokémon-sized. It claims the collectibles infrastructure market (pricing, authentication, vault, liquidity) can grow 5–10× from near zero, including Metal, Plastic, and Burst in one secondary pool, and can compete with Hot Wheels.

Those figures are the page’s thesis. They were not re-checked against Circana, Takara Tomy, or Taiwanese news in this pass, and they are not Oracle marks.

## What it implies for this repo

Requiem already is the price index the page says does not exist elsewhere: sold comps, median, IQR, source toggles. RIPBEYS is the public view of that index. The page’s “no PSA-equivalent; condition grading is greenfield” matches the code: condition is `sealed`, `like_new`, `used`, and `unknown`, not a letter grade.

UX-03 Wizard Rod is a canonical product, `prod-x-ux-03-complete-loose`, parts `x-blade-wizard-rod`, `x-ratchet-5-70`, `x-bit-db`. No RIPBEYS listing id points at it. The page’s Shopee resale (NT$295 retail, NT$2,500 resale) is not an Oracle value and was not inserted into a listing.

A sprite filename `BX35_WizardRod1-60r.png` exists in `apps/web/src/consumer/data/art.json`. Product code BX-35 on the X seed is Phoenix Wing (5-80H), not Wizard Rod. That filename was not used to reassign a model or a listing.
