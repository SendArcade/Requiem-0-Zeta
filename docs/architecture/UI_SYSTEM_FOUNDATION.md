# Requiem-0-Zeta UI system foundation

Local visual governance for the consumer layer. Application UI code is unchanged by this document. Production deploy waits for an explicit ship, push, or deploy instruction.

Source of the current UI: `UI_FORENSIC_AUDIT.md`.

## Visual direction

A black showroom for physical Beys. One object, large type, short facts. Yellow is the mark. Cyan is the control. The page is a place to look at a Bey and read its Oracle state. It is not a SaaS dashboard and not a neon poster.

NFT.com and cinematic reference clips inform pacing and object scale only. Layouts, type, and components stay Requiem.

## Color

| Token | Hex | Use |
|---|---|---|
| Paper | `#000000` | Page |
| Paper 2 | `#0A0A0A` | Recessed band |
| Surface | `#111111` | Plates |
| Ink | `#F5F5F5` | Primary text |
| Ink 3 | `#A3A3A3` | Secondary |
| Mute | `#8A8A8A` | Labels |
| Sticker | `#FFEA00` | Signature, one accent per view |
| Cyan | `#13FFF3` | Links, focus, live data |
| Lime | `#A2FF1F` | Positive status only |
| Red | `#EF4139` | Warning and error |

No new gradients. No glass stacks. Existing type colors for attack, defense, stamina, and balance stay.

## Typography

- Display: Pixelify Sans. Short uppercase titles.
- UI: Nippo, then Chakra Petch. 15px body, 10–11px tracked labels.
- Script: Reenie Beanie, at most once on the homepage.
- Figures: tabular, larger than their label.

## Spacing

4, 8, 12, 16, 24, 40, 64, 96. Catalogue content width stays near 1180px. Grid gap 18px until a redesign replaces the grid. Do not fill leftover space.

## Motion

| Name | Duration |
|---|---|
| Micro | 160ms |
| UI | 280ms |
| Section | 480ms |

Easing: `cubic-bezier(0.22, 1, 0.36, 1)`. CSS for hover. Motion for React state. GSAP for a real timeline. rAF only in the model loop or a single pointer. Reduced motion removes boot cinema, parallax, and card lift. Catalogue scroll does not choreograph 578 cards.

## Interaction

Hover and focus are enough. One pointer system later; do not add a cursor now. Keyboard works without it. Touch ignores magnet and custom cursors.

## Responsive

Use the breakpoints already in CSS: 1180, 1000, 860, 820, 700, 520, 430. At 700px, non-forced 3D becomes a poster. No horizontal overflow.

## Accessibility

Real buttons and links. 3px focus outline. Oracle unavailable is text, not color alone. Alt text on content images. Decorative images stay empty alt.

## Performance

`ModelStage` for the catalogue. No new `ModelViewer` per card. Home already mounts several viewers after boot; do not add more. Oracle client cache stays. Do not add an animation package.

## Component map (future, not built here)

Motion helpers wrap existing `ScrollRise`. Layout helpers wrap current sections. Cards keep `OracleValuation` and `ModelSlot`. Nav restyle does not move routes.

## Localhost workflow

1. Read the forensic audit.
2. Change consumer UI locally.
3. Run the Vite app on localhost.
4. Check `/`, `/market`, `/market/bx-002`, `/lab` at desktop and 390px.
5. Stop. Wait.

"Continue" means another local pass. "Ship", "push", or "deploy" is the only production gate.

## Production gate

No commit, push, Railway deploy, database write, or API contract change in this phase.

## Invariants

578 listing ids. Mesh from listing id. Price from bridge to `/api/product` or `/api/asset`. Null mark stays unavailable. `Listing.price` is not a value. Poster if the model fails. `/lab?bey=` and `/market/:listingId` keep working. Next rewrites do not swallow `/api` or Requiem pages. Gacha service and its data stay untouched.

## Risks

Two navs and two stylesheets. Overlapping motion tools. Homepage multi-viewer cost. X feed 404 on the Next origin. Shop count is listings; BeyOracle browse count is parts.

## First redesign, when asked

Marketplace chrome only: spacing, type, card well, filter bar. Leave data, sort, load more, Oracle component, and `ModelSlot` behavior in place. Homepage cinematic work comes after the catalogue is calm, because the homepage currently mounts more WebGL.
