import { afterEach, expect, it, vi } from 'vitest';
import { maskFromSources } from '@beyoracle/shared';
import { getProductDataFromFixtures } from './product-data.js';

vi.mock('@beyoracle/catalog', async importOriginal => {
  const actual = await importOriginal<typeof import('@beyoracle/catalog')>();
  return {
    ...actual,
    loadAllFixtures: () => ['mercari_jp', 'shopee_tw'].flatMap(source => [1, 2, 3].map(i => ({
      externalId: `${source}-${i}`, partId: 'x-bx-01-blade', title: 'Beyblade X BX-01 Dran Sword Starter',
      price: source === 'mercari_jp' ? 1000 + i : 50000 + i,
      currency: 'JPY', source, status: 'sold', condition: 'used',
      observedAt: '2026-07-20T00:00:00Z', url: 'https://example.com/sale',
    }))),
  };
});
afterEach(() => vi.useRealTimers());
it('keeps the fixture mark, history and displayed comps on the same selected sources', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-07-25T00:00:00Z'));
  const data = getProductDataFromFixtures('prod-x-bx-01-starter', ['mercari_jp']);
  expect(data?.oracle?.sourcesMask).toBe(maskFromSources(['mercari_jp']));
  expect(data?.oracle?.nComps).toBe(3);
  expect(data?.oracle?.value).toBeLessThan(2000);
  expect(data?.chart).toHaveLength(3);
  expect(data?.comps).toHaveLength(3);
  expect(data?.comps.every(comp => comp.source === 'mercari_jp')).toBe(true);
});
