# Whole-SKU product seeds

Runtime loader (`loadProducts` in `@beyoracle/catalog`) merges:

1. **`products.json`** — legacy monolithic catalog (backward compat)
2. **`products-{generation}.json`** — per-gen worker output (`products-plastic.json`, `products-metal.json`, `products-burst.json`, `products-x.json`)

Duplicate `id` values: per-gen files **override** legacy rows.

Rebuild monolithic from parts + BeyBrew: `pnpm products:build`
