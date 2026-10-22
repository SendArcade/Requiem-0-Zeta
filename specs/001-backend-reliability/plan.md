# Plan

1. Narrow product candidates by code before expensive conflict checks; reuse fixture matching work.
2. Thread an explicit as-of instant through valuation, windows, and scoreboard; make date-sensitive tests deterministic locally.
3. Harden admin authorization, mutation inputs, session isolation, SSE lifecycle, database configuration, and production fixture selection. Add focused regression tests and health endpoints.
4. Run all builds/type checks/tests, fixture smoke and matcher live probe. Add CI matching the validated build order.
5. Commit all authorized website/backend fixes; fetch and push main with a normal fast-forward. Verify the remote SHA and any accessible runtime health. No database migrations, destructive maintenance or worker backfill flags are needed.
