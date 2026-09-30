# Oracle linking contract

RIPBEYS listings, 3D files, and Requiem products are three different identities. A listing number is never a product code.

## Chain

```
listing id (bx-002, bb-143)
  → oracle-bridge.json (mapStatus, oracleKind, requiem product or part id)
  → GET /api/product/{requiemProductId}   when oracleKind = product
  → GET /api/asset/{requiemPartId}        when oracleKind = part
  → displayed mark, or an explicit unavailable state
```

Visual files are chosen only from `visual-assets.json` by the same listing id. They are not chosen from the Oracle id.

## Kinds

| oracleKind | Public catalogue price | Bey page chart |
|---|---|---|
| product | Product Oracle median, when the API returns a number | `/api/product/{id}` |
| part | Hidden. A blade or layer mark is not a whole-Bey price | `/api/asset/{id}`, labeled as a part mark |
| none | Hidden | Unavailable. Includes assembled X with no product seed |

Confirmed product pages link to `/product/{requiemProductId}`. Confirmed part pages link to `/asset/{requiemPartId}`. Those routes are the BeyOracle pages on the same origin. Do not build either URL from the listing number.

## What must stay true

- `bx-002` is Dran Dagger, product `prod-x-dran-dagger-4-60r-complete-loose`. It is not `BX-02`.
- Product bridge rows have a product id and may also list parts. The page still fetches the product.
- Part bridge rows have `requiemProductId: null`.
- `Listing.price` is not read as a value.
- The frontend does not compute medians. Chart math on the Bey page repeats the BeyOracle rolling-median display of the API payload.

## Audit

`pnpm audit:identity` checks the bridge counts, the product/part split, and filename agreement. It does not call the API and it does not open meshes.
