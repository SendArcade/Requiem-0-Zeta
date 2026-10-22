# Repository structure

Consolidate public and collector pages in one Next application without changing public URLs, catalogues, pricing rules, or production data. Remove workspace cycles, isolate reusable pricing/database operations from ingestion adapters, move deployable workers to apps, move maintenance commands to tools, and organize root documentation.

Acceptance: clean topological builds need no bootstrap exception; web has no ingestion dependency; consumer routes use Next navigation and no Vite build/copy; all current tests and production routes remain valid; deployment assembly is one command; architecture checks prevent cycles and reversed application/library dependencies. Keep compatibility for externally configured worker Docker paths. Do not run maintenance writes against a database.

Mobile follow-up: retain the web app and add phone-friendly persistent navigation, safe-area and dynamic viewport handling, usable touch targets, accessible menus and standalone home-screen metadata. Verify narrow phone and landscape layouts without horizontal page overflow.
