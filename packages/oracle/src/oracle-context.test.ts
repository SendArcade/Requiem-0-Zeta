import { beforeEach, afterEach, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-07-25T00:00:00Z"));
});
afterEach(() => vi.useRealTimers());

import { describe, it, expect } from "vitest";
import type { PartDTO } from "@beyoracle/shared";
import { buildOracleContext, cohortCompsMap } from "./oracle-context.js";
import type { CompInput } from "./oracle-value.js";

const part: PartDTO = {
  id: "x-bx-01-blade",
  generation: "x",
  partType: "blade",
  nameEn: "Dran Sword",
  nameJp: "ドランソード",
  nameZh: null,
  productCodes: ["BX-01"],
  attrs: {},
};

const sibling: PartDTO = {
  id: "x-bx-02-blade",
  generation: "x",
  partType: "blade",
  nameEn: "Wizard Arrow",
  nameJp: null,
  nameZh: null,
  productCodes: ["BX-02"],
  attrs: {},
};

const now = new Date("2026-07-15T00:00:00Z");
const may = new Date("2026-05-15T00:00:00Z");
const june = new Date("2026-06-15T00:00:00Z");

describe("buildOracleContext", () => {
  it("builds cohort prior from sibling marks", () => {
    const map = cohortCompsMap({
      [part.id]: [
        {
          price: 1000,
          currency: "JPY",
          source: "mercari_jp",
          observedAt: now,
          status: "sold",
          condition: "used",
          landedJpy: 1000,
        },
      ],
      [sibling.id]: [
        {
          price: 800,
          currency: "JPY",
          source: "mercari_jp",
          observedAt: now,
          status: "sold",
          condition: "used",
          landedJpy: 800,
        },
        {
          price: 900,
          currency: "JPY",
          source: "mercari_jp",
          observedAt: now,
          status: "sold",
          condition: "used",
          landedJpy: 900,
        },
      ],
    });

    const ctx = buildOracleContext(part, map);
    expect(ctx.cohortPrior).toBe(850);
  });

  it("builds cohort index from multi-month sales", () => {
    const sales = [
      [part.id, 1000, may],
      [sibling.id, 1100, may],
      [part.id, 1200, june],
      [sibling.id, 1300, june],
    ] as const;

    const byPart: Record<string, CompInput[]> = {};
    for (const [pid, price, date] of sales) {
      const row = {
        price,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: date,
        status: "sold" as const,
        condition: "used" as const,
        landedJpy: price,
      };
      byPart[pid] = [...(byPart[pid] ?? []), row];
    }

    const ctx = buildOracleContext(part, cohortCompsMap(byPart));
    expect(ctx.cohortIndex).not.toBeNull();
  });
});
