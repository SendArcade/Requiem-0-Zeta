import { afterEach, expect, it, vi } from 'vitest';
import { getDb } from './client.js';
afterEach(() => vi.unstubAllEnvs());
it('requires explicit Railway database configuration instead of defaulting to localhost', () => {
  vi.stubEnv('DATABASE_URL', '');
  expect(() => getDb()).toThrow('DATABASE_URL is required');
});
