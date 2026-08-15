/** Wave 0 / oracle backfill — never silently substitute fixture rows for live API failures. */
export function ingestNoFixtureFallback(): boolean {
  return (
    process.env.INGEST_NO_FIXTURE_FALLBACK === "1" ||
    process.env.BURST_WAVE0_STRICT_LIVE === "1" ||
    process.env.BURST_WAVE0_LOOP === "1" ||
    process.env.BURST_WAVE0_INGEST === "1" ||
    process.env.MERCARI_STRICT === "1" ||
    process.env.YAHOO_AUCTIONS_STRICT === "1"
  );
}

export function wave0LiveIngestMode(): boolean {
  return (
    process.env.BURST_WAVE0_LOOP === "1" ||
    process.env.BURST_WAVE0_INGEST === "1"
  );
}
