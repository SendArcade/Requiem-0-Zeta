#!/usr/bin/env tsx
import { ingestFixturesSmoke } from "../pipeline.js"; // eslint-disable-line

async function main() {
  const result = await ingestFixturesSmoke();
  console.log("Fixture ingest smoke:", result);
  if (result.mercari === 0 || result.shopee === 0) {
    console.error("FAIL: expected fixture observations for mercari + shopee");
    process.exit(1);
  }
  console.log("OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
