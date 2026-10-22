import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.resetModules(); vi.doUnmock('node:fs'); });
it('reuses the lookup index and reloads it when the catalogue changes', async () => {
  let version = 1;
  const read = vi.fn(() => JSON.stringify([{ id: 'part', nameEn: `Version ${version}` }]));
  vi.doMock('node:fs', async importOriginal => ({
    ...await importOriginal<typeof import('node:fs')>(),
    statSync: () => ({ mtimeMs: version, ctimeMs: version, size: 100 }),
    readFileSync: read,
  }));
  const { getPartById } = await import('./load.js');
  expect(getPartById('part')?.nameEn).toBe('Version 1');
  expect(getPartById('missing')).toBeUndefined();
  expect(read).toHaveBeenCalledTimes(1);
  version = 2;
  expect(getPartById('part')?.nameEn).toBe('Version 2');
  expect(read).toHaveBeenCalledTimes(2);
});
