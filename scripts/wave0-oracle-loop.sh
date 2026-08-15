#!/usr/bin/env bash
# Autonomous Wave 0 oracle loop on Railway worker.
# Polls logs until 7/7 PASS or timeout. Requires linked Railway project + npx @railway/cli.
set -euo pipefail

SERVICE="${RAILWAY_SERVICE:-worker}"
MAX_WAIT_MIN="${WAVE0_LOOP_MAX_WAIT_MIN:-180}"
POLL_SEC="${WAVE0_LOOP_POLL_SEC:-90}"
LOOP_MAX="${BURST_WAVE0_LOOP_MAX:-10}"

railway() { npx --yes @railway/cli "$@"; }

echo "[wave0-oracle-loop] deploy latest worker…"
railway up --service "$SERVICE" --detach

echo "[wave0-oracle-loop] reset env — enable loop, disable skip/done guards…"
railway variable delete BURST_WAVE0_LOOP_DONE --service "$SERVICE" 2>/dev/null || true
railway variable delete BURST_WAVE0_INGEST_DONE --service "$SERVICE" 2>/dev/null || true
railway variable delete BURST_WAVE0_VERIFY_DONE --service "$SERVICE" 2>/dev/null || true
railway variable delete BURST_WAVE0_INGEST --service "$SERVICE" 2>/dev/null || true
railway variable delete BURST_WAVE0_VERIFY --service "$SERVICE" 2>/dev/null || true
railway variable delete BURST_WAVE0_SKIP_INGEST --service "$SERVICE" 2>/dev/null || true

railway variable set \
  BURST_WAVE0_LOOP=1 \
  "BURST_WAVE0_LOOP_MAX=${LOOP_MAX}" \
  WAVE0_INGEST_MAX_QUERIES=24 \
  WAVE0_INGEST_QUERY_BATCH=4 \
  MERCARI_MAX_PAGES=3 \
  YAHOO_MAX_PAGES=3 \
  --service "$SERVICE"

echo "[wave0-oracle-loop] polling logs (max ${MAX_WAIT_MIN}m, every ${POLL_SEC}s)…"
deadline=$((SECONDS + MAX_WAIT_MIN * 60))
last_pass=""

while (( SECONDS < deadline )); do
  logs="$(railway logs --service "$SERVICE" --lines 400 2>&1 || true)"

  if echo "$logs" | grep -q "7/7 PASS"; then
    echo "$logs" | grep -E "wave0:verify|PASS|FAIL|wave0-loop|DONE" | tail -20
    echo "[wave0-oracle-loop] SUCCESS — 7/7 PASS"
    railway variable set BURST_WAVE0_LOOP_DONE=1 --service "$SERVICE"
    railway variable delete BURST_WAVE0_LOOP --service "$SERVICE" 2>/dev/null || true
    exit 0
  fi

  pass_line="$(echo "$logs" | grep "wave0:verify]" | tail -1 || true)"
  if [[ -n "$pass_line" && "$pass_line" != "$last_pass" ]]; then
    echo "[wave0-oracle-loop] progress: $pass_line"
    last_pass="$pass_line"
    echo "$logs" | grep -E "wave0-loop|wave0-ingest|PASS|FAIL" | tail -12
  fi

  if echo "$logs" | grep -q "STOP — .*/7 after"; then
    echo "$logs" | grep -E "wave0-loop|wave0:verify|PASS|FAIL" | tail -20
    echo "[wave0-oracle-loop] loop exhausted — not 7/7 yet"
    railway variable set BURST_WAVE0_LOOP_DONE=1 --service "$SERVICE"
    railway variable delete BURST_WAVE0_LOOP --service "$SERVICE" 2>/dev/null || true
    exit 1
  fi

  sleep "$POLL_SEC"
done

echo "[wave0-oracle-loop] TIMEOUT after ${MAX_WAIT_MIN}m"
railway logs --service "$SERVICE" --lines 80 | tail -40
exit 1
