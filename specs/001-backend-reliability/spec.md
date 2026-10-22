# Backend reliability

Goal: a passing deterministic suite, responsive matching and fixture reads, and safe production APIs. Preserve catalogue identities, precision thresholds, Railway-only data, and existing user changes.

Acceptance: full tests and type checks pass without skipped assertions or inflated timeouts; product evaluation retains accuracy thresholds; historical valuations accept an explicit as-of date; invalid inputs cannot enter pricing; admin mutations require authentication in production; watchlist inputs are validated; SSE isolates private alerts and releases resources; health/readiness endpoints report service state. Push the validated result to main without rewriting remote history, then verify deployment where credentials permit.
