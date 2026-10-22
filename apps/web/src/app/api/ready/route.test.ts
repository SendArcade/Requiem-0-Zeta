import { afterEach, expect, it, vi } from 'vitest';
import { getDb } from '@beyoracle/db';
import { GET } from './route';

vi.mock('@beyoracle/db', () => ({ getDb: vi.fn() }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it('checks database connectivity for production readiness', async () => {
  vi.stubEnv('DATA_SOURCE', 'db');
  const execute = vi.fn(async () => []);
  vi.mocked(getDb).mockReturnValue({ execute } as unknown as ReturnType<typeof getDb>);
  expect((await GET()).status).toBe(200);
  expect(execute).toHaveBeenCalledOnce();
});
it('returns 503 without exposing database failure details', async () => {
  vi.stubEnv('DATA_SOURCE', 'db');
  vi.mocked(getDb).mockImplementation(() => { throw new Error('private credentials'); });
  const response = await GET();
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ status: 'unavailable' });
});
it('marks explicit fixture mode separately', async () => {
  vi.stubEnv('DATA_SOURCE', 'fixtures');
  expect(await (await GET()).json()).toEqual({ status: 'ready', mode: 'fixtures' });
  expect(getDb).not.toHaveBeenCalled();
});
