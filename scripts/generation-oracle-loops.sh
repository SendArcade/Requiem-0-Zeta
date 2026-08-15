#!/usr/bin/env bash
# Start parallel generation oracle loops on Railway (burst + plastic + metal).
set -euo pipefail

SERVICE="${RAILWAY_SERVICE:-worker}"
MAX_WAIT_MIN="${GEN_LOOP_MAX_WAIT_MIN:-360}"
POLL_SEC="${GEN_LOOP_POLL_SEC:-120}"
GENERATIONS="${GENERATION_ORACLE_LOOP:-burst,plastic,metal}"
LOOP_MAX="${GENERATION_ORACLE_LOOP_MAX:-6}"

railway() { npx --yes @railway/cli "$@"; }

echo "[gen-oracle-loops] deploy worker…"
railway up --service "$SERVICE" --detach

echo "[gen-oracle-loops] enable parallel loops: ${GENERATIONS}"
railway variable delete GENERATION_ORACLE_LOOP_DONE --service "$SERVICE" 2>/dev/null || true

railway variable set \
  "GENERATION_ORACLE_LOOP=${GENERATIONS}" \
  "GENERATION_ORACLE_LOOP_MAX=${LOOP_MAX}" \
  GENERATION_ORACLE_BATCH_LANE_COUNT=3 \
  GENERATION_ORACLE_STAGGER_MS=45000 \
  GEN_ORACLE_QUERY_BATCH=24 \
  GEN_ORACLE_INNER_BATCH=4 \
  GEN_ORACLE_BATCH_PAUSE_MS=5000 \
  GEN_ORACLE_ITER_PAUSE_MS=30000 \
  GEN_ORACLE_MAX_QUERIES=400 \
  INGEST_NO_FIXTURE_FALLBACK=1 \
  INGEST_SEQUENTIAL_SOURCES=1 \
  YAHOO_TIMEOUT_MS=45000 \
  MERCARI_TIMEOUT_MS=30000 \
  MERCARI_MAX_PAGES=3 \
  YAHOO_MAX_PAGES=2 \
  INGEST_LIMIT_PER_QUERY=25 \
  --service "$SERVICE"

echo "[gen-oracle-loops] polling (max ${MAX_WAIT_MIN}m, every ${POLL_SEC}s)…"
deadline=$((SECONDS + MAX_WAIT_MIN * 60))

while (( SECONDS < deadline )); do
  logs="$(railway logs --service "$SERVICE" --lines 500 2>&1 || true)"

  if echo "$logs" | grep -q "gen-oracle:multi] all loops finished"; then
    echo "$logs" | grep -E "gen-oracle:" | tail -30
    echo "[gen-oracle-loops] SUCCESS — all generation loops finished"
    railway variable set GENERATION_ORACLE_LOOP_DONE=1 --service "$SERVICE"
    railway variable delete GENERATION_ORACLE_LOOP --service "$SERVICE" 2>/dev/null || true
    exit 0
  fi

  echo "$logs" | grep -E "gen-oracle:(burst|plastic|metal|multi)" | tail -8 || true
  sleep "$POLL_SEC"
done

echo "[gen-oracle-loops] TIMEOUT"
railway logs --service "$SERVICE" --lines 60 | tail -40
exit 1
