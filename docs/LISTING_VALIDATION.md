# Listing validation

Run:

```bash
pnpm audit:identity
```

The script reads the bridge, the visual map, and `oracleNames.ts`. It writes `reports/ripbeys-identity-audit.json` and exits 1 if an invariant fails.

## Invariants

- 578 listing ids in the bridge
- every listing id has a visual row
- 26 product-oracle rows, each with a product id
- every part-oracle row has a part id and no product id
- no oracle id is a bare `BX-NN` code

## Row status

`asset_status` is filename agreement, not a screenshot of the mesh.

`identity_status` follows the bridge: confirmed product or part is `PASS`, ambiguous or conflict is `AMBIGUOUS`, other rows with no oracle are `UNAVAILABLE`.

`price_status` is `UNVERIFIED` for product rows because the script does not call the API. Live numbers are a separate read of `/api/product/{id}`. Part and none rows are `UNAVAILABLE` as whole-Bey prices.

## Public visibility

A listing is shown in `/market` only when both are true:

- `isProductOracleEligible`
- the product response has a numeric value

Direct `/market/{id}` still opens the other 578 records, with an unavailable or part-mark state.
