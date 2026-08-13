import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@beyoracle/ingest": resolve(root, "../ingest/src/index.ts"),
      "@beyoracle/jobs": resolve(root, "../jobs/src/index.ts"),
    },
  },
});
