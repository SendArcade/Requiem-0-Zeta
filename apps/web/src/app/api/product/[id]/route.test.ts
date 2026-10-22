import { beforeEach, describe, expect, it, vi } from 'vitest';
import { productMarkConditions } from '@beyoracle/shared';
import { getProductData } from '@/lib/product-data';
import { GET } from './route';

vi.mock('@/lib/product-data', () => ({ getProductData: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));

beforeEach(() => {
  vi.mocked(getProductData).mockReset();
  vi.mocked(getProductData).mockImplementation(async (_id, _sources, _currency, conditions) => ({
    conditions: conditions ?? productMarkConditions('complete_sealed'),
  } as Awaited<ReturnType<typeof getProductData>>));
});

describe('product API condition defaults', () => {
  it.each(['', '?conditions='])('preserves SKU defaults when conditions are omitted or empty (%s)', async query => {
    const response = await GET(new Request(`http://localhost/api/product/sealed-product${query}`), {
      params: Promise.resolve({ id: 'sealed-product' }),
    });
    expect(getProductData).toHaveBeenCalledWith('sealed-product', expect.any(Array), 'JPY', undefined);
    expect(await response.json()).toEqual({ conditions: ['sealed'] });
  });

  it('preserves an explicitly chosen condition filter', async () => {
    const response = await GET(new Request('http://localhost/api/product/sealed-product?conditions=sealed,used'), {
      params: Promise.resolve({ id: 'sealed-product' }),
    });
    expect(await response.json()).toEqual({ conditions: ['sealed', 'used'] });
  });
});
