#!/usr/bin/env node
/**
 * One-shot migrate + seed for Railway Postgres.
 * Run: railway run -- node scripts/railway-bootstrap.mjs
 */
import { spawnSync } from "node:child_process";

const steps = [
  ["pnpm", ["db:migrate"]],
  ["pnpm", ["db:seed"]],
];

for (const [cmd, args] of steps) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true, cwd: new URL("..", import.meta.url).pathname });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

console.log("\nBootstrap complete: migrations applied + catalog seeded.");
