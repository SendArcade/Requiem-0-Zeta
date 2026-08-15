#!/usr/bin/env bash
# Start all oracle loops: Wave 0 gap fill + parallel burst/plastic/metal generation loops.
set -euo pipefail

SERVICE="${RAILWAY_SERVICE:-worker}"

railway() { npx --yes @railway/cli "$@"; }

echo "[oracle-loops-all] deploy worker with Wave0 + generation loops…"
railway up --service "$SERVICE" --detach

echo "[oracle-loops-all] set combined loop env…"
railway variable delete BURST_WAVE0_LOOP_DONE --service "$SERVICE" 2>/dev/null || true
railway variable delete GENERATION_ORACLE_LOOP_DONE --service "$SERVICE" 2>/dev/null || true
railway variable delete BURST_WAVE0_SKIP_INGEST --service "$SERVICE" 2>/dev/null || true

railway variable set \
  BURST_WAVE0_LOOP=1 \
  BURST_WAVE0_LOOP_MAX=10 \
  BURST_WAVE0_STRICT_LIVE=1 \
  "GENERATION_ORACLE_LOOP=burst,plastic,metal" \
  GENERATION_ORACLE_LOOP_MAX=6 \
  GENERATION_ORACLE_BATCH_LANE_COUNT=3 \
  GENERATION_ORACLE_STAGGER_MS=45000 \
  INGEST_NO_FIXTURE_FALLBACK=1 \
  INGEST_SEQUENTIAL_SOURCES=1 \
  WAVE0_INGEST_MAX_QUERIES=36 \
  WAVE0_INGEST_QUERY_BATCH=3 \
  GEN_ORACLE_QUERY_BATCH=24 \
  GEN_ORACLE_INNER_BATCH=4 \
  GEN_ORACLE_MAX_QUERIES=400 \
  YAHOO_TIMEOUT_MS=45000 \
  MERCARI_TIMEOUT_MS=30000 \
  MERCARI_MAX_PAGES=3 \
  YAHOO_MAX_PAGES=2 \
  INGEST_LIMIT_PER_QUERY=25 \
  --service "$SERVICE"

echo "[oracle-loops-all] polling combined logs…"
chmod +x scripts/wave0-oracle-loop.sh scripts/generation-oracle-loops.sh 2>/dev/null || true

SESSION="oracle-loops-monitor"
tmux -f /exec-daemon/tmux.portal.conf kill-session -t "$SESSION" 2>/dev/null || true
tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION" -c "/workspace" -- "${SHELL:-zsh}" -l
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION:0.0" 'while true; do echo "=== $(date -u +%H:%M:%S) ==="; npx --yes @railway/cli logs --service worker --lines 120 2>&1 | rg "wave0|gen-oracle|PASS|FAIL|finished" | tail -25; sleep 120; done | tee /tmp/oracle-loops-monitor.log' C-m

echo "[oracle-loops-all] monitor: tail -f /tmp/oracle-loops-monitor.log"
echo "[oracle-loops-all] Wave0 target: 7/7 PASS | Gen loops: burst+plastic+metal parallel"
