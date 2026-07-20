import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadMatcherContext } from "@beyoracle/catalog";
import type { EvalCase } from "./eval.js";
import { runEval } from "./eval.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const evalPath = join(__dirname, "..", "fixtures", "eval-titles.json");

describe("matcher eval set", () => {
  const cases = JSON.parse(readFileSync(evalPath, "utf-8")) as EvalCase[];
  const ctx = loadMatcherContext();

  it(`has at least 200 labeled titles (got ${cases.length})`, () => {
    expect(cases.length).toBeGreaterThanOrEqual(200);
  });

  it("meets shape + match accuracy thresholds", () => {
    const report = runEval(cases, ctx);
    expect(report.shapeAccuracy).toBeGreaterThanOrEqual(0.95);
    expect(report.matchAccuracy).toBeGreaterThanOrEqual(0.85);

    if (report.failures.length > 0 && process.env.EVAL_VERBOSE === "1") {
      console.log("Eval failures:", report.failures.slice(0, 10));
    }
  }, 60_000);
});
