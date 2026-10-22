import { afterEach, expect, it, vi } from 'vitest';
import { isDbAvailable } from './db-data';
afterEach(() => vi.unstubAllEnvs());
it('never silently selects fixtures in production after a failed probe', async () => {
  vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('DATA_SOURCE', 'auto');
  expect(await isDbAvailable()).toBe(true);
});
it('allows explicitly selected fixture development', async () => {
  vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('DATA_SOURCE', 'fixtures');
  expect(await isDbAvailable()).toBe(false);
});
