1. Extract catalog synchronization and maintenance tooling, and shared pricing services. Preserve ingestion API compatibility through re-exports.
2. Move worker to apps and update deployment configuration, retaining a compatibility Dockerfile path.
3. Move consumer components/assets into apps/web, use native Next routes and navigation, isolate consumer/collector styles with route-group root layouts.
4. Centralize build and standalone assembly; enforce dependency boundaries in tests and CI.
5. Move historical audits and operations/design documents, repair links, and document the resulting architecture.
6. Verify frozen installation, a clean build, types, tests, fixture smoke, native navigation and production HTTP behavior.
7. Add phone navigation, touch-safe links, accessible menus, standalone metadata and automated mobile browser coverage.
