import { afterEach, describe, expect, it, vi } from "vitest";
import { requireAdmin } from "./admin-auth";

afterEach(() => vi.unstubAllEnvs());
const req = (authorization?: string) => new Request('https://site.example/api/admin/review', { headers: authorization ? { authorization } : {} });
describe('production admin access', () => {
  it('fails closed without a configured token', () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('ADMIN_API_TOKEN', '');
    expect(requireAdmin(req())?.status).toBe(403);
  });
  it('requires the configured bearer token', () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('ADMIN_API_TOKEN', 'test-only-admin');
    expect(requireAdmin(req())?.status).toBe(401);
    expect(requireAdmin(req('Bearer wrong'))?.status).toBe(401);
    expect(requireAdmin(req('Bearer test-only-admin'))).toBeNull();
  });
  it('preserves unconfigured local development', () => {
    vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('ADMIN_API_TOKEN', '');
    expect(requireAdmin(req())).toBeNull();
  });
});
