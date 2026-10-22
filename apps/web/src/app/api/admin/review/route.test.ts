import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';
import { isDbAvailable } from '@/lib/db-data';
import { approveReviewQueueItem, rejectReviewQueueItem } from '@beyoracle/ingest';
vi.mock('@/lib/db-data', () => ({ isDbAvailable: vi.fn(async () => false) }));
vi.mock('@beyoracle/ingest', () => ({ approveReviewQueueItem: vi.fn(), rejectReviewQueueItem: vi.fn() }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('admin route authorization', () => {
  it('denies both reads and writes before database access in production', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('ADMIN_API_TOKEN', '');
    expect((await GET(new Request('https://site.example/api/admin/review'))).status).toBe(403);
    expect((await POST(new Request('https://site.example/api/admin/review', { method: 'POST', body: '{"id":"record","action":"approve"}' }))).status).toBe(403);
    expect(isDbAvailable).not.toHaveBeenCalled();
    expect(approveReviewQueueItem).not.toHaveBeenCalled();
  });
  it('rejects unknown actions rather than treating them as rejection', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('ADMIN_API_TOKEN', 'test-only-admin');
    const res = await POST(new Request('https://site.example/api/admin/review', {
      method: 'POST', headers: { authorization: 'Bearer test-only-admin' }, body: '{"id":"record","action":"typo"}',
    }));
    expect(res.status).toBe(400);
    expect(rejectReviewQueueItem).not.toHaveBeenCalled();
  });
});
