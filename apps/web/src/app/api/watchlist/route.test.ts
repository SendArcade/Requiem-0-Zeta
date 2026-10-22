import { afterEach, describe, expect, it, vi } from 'vitest';
import { PATCH, POST } from './route';
import { getDb } from '@beyoracle/db';
vi.mock('@beyoracle/db', () => ({ getDb: vi.fn(), watchlist: {} }));
vi.mock('@beyoracle/catalog', () => ({ getPartById: () => ({ id: 'part' }) }));
vi.mock('@/lib/db-data', () => ({ isDbAvailable: async () => false, getAssetDataFromDb: vi.fn() }));
vi.mock('@/lib/watchlist', () => ({ getSessionId: async () => 'session' }));
afterEach(() => vi.clearAllMocks());
const req = (body: unknown) => new Request('https://site.example/api/watchlist', { method: 'POST', body: JSON.stringify(body) });
describe('watchlist validation before database writes', () => {
  it.each([-1, 0, 101, '10'])('rejects invalid threshold %s', async alertThresholdPct => {
    expect((await POST(req({ partId: 'part', alertThresholdPct }))).status).toBe(400);
    expect(getDb).not.toHaveBeenCalled();
  });
  it('rejects empty and incorrectly typed updates', async () => {
    expect((await PATCH(req({ partId: 'part' }))).status).toBe(400);
    expect((await PATCH(req({ partId: 'part', resetBaseline: 'true' }))).status).toBe(400);
    expect(getDb).not.toHaveBeenCalled();
  });
  it('reports unavailable infrastructure without suggesting local pricing databases', async () => {
    const res = await POST(req({ partId: 'part', alertThresholdPct: 10 }));
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).toContain('Railway');
  });
});
