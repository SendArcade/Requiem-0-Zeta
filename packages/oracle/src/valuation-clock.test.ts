import { describe, expect, it } from 'vitest';
import { allSourcesMask, maskFromSources } from '@beyoracle/shared';
import { buildTimeSeries, computeOracleValue, filterComps, type CompInput } from './oracle-value.js';
import { scoreboardLeaveOneOut } from './eval-scoreboard.js';

const asOf = new Date('2020-01-15T00:00:00Z');
const comp: CompInput = { price: 1000, currency: 'JPY', source: 'mercari_jp', observedAt: new Date('2020-01-10T00:00:00Z'), status: 'sold', condition: 'used' };
describe('valuation clock and input integrity', () => {
  it.each(['v1', 'v2'] as const)('replays a historical valuation using %s', engine => {
    const mark = computeOracleValue('test', [comp], { asOf, engine, minComps: 1 });
    expect(mark?.value).toBe(1000);
    expect(mark?.asOf).toEqual(asOf);
    expect(computeOracleValue('test', [comp], { asOf: new Date('2021-01-15'), engine, minComps: 1 })).toBeNull();
  });
  it('never lets future, invalid, or non-positive prices contaminate the mark', () => {
    const invalid: CompInput[] = [
      { ...comp, price: NaN }, { ...comp, price: Infinity }, { ...comp, price: -1 }, { ...comp, price: 0 },
      { ...comp, observedAt: new Date('invalid') }, { ...comp, observedAt: new Date('2020-01-16') },
      { ...comp, landedJpy: Infinity }, { ...comp, fxRateAtSale: NaN }, { ...comp, fxRateAtSale: -1 }, { ...comp, venueWeightMultiplier: -1 },
    ];
    expect(filterComps([comp, ...invalid], { asOf, windowDays: 90, sourcesMask: allSourcesMask(), conditions: ['used'] })).toEqual([comp]);
    expect(buildTimeSeries([comp, ...invalid], { asOf })).toEqual([{ date: '2020-01-10', price: 1000 }]);
  });
  it('respects source selection', () => {
    expect(computeOracleValue('test', [comp], { asOf, minComps: 1, sourcesMask: maskFromSources(['shopee_tw']) })).toBeNull();
  });
  it('uses the requested clock in every scoreboard fold', () => {
    const report = scoreboardLeaveOneOut([{ id: 'panel', assetId: 'test', truth: 1000, comps: [1,2,3,4].map(daysAgo => ({ price: 1000, currency: 'JPY', source: 'mercari_jp', daysAgo, condition: 'used' })) }], { asOf });
    expect(report.foldCount).toBe(4);
    expect(report.maeV1).toBe(0);
    expect(report.maeV2).toBe(0);
  });
});
