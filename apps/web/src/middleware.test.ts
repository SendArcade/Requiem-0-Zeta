import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

afterEach(() => vi.unstubAllEnvs());
it('gives the first request the same private session as the response cookie', () => {
  vi.stubEnv('NODE_ENV', 'production');
  const response = middleware(new NextRequest('https://site.example/api/watchlist', { headers: { cookie: 'other=value' } }));
  const session = response.cookies.get('beyoracle_session')!;
  expect(session.value).toBeTruthy();
  expect(session.secure).toBe(true);
  expect(response.headers.get('x-middleware-request-cookie')).toContain(`beyoracle_session=${session.value}`);
  expect(response.headers.get('x-middleware-request-cookie')).toContain('other=value');
});
it('preserves an existing session', () => {
  const response = middleware(new NextRequest('https://site.example/api/watchlist', { headers: { cookie: 'beyoracle_session=12345678-1234-4234-8234-123456789abc' } }));
  expect(response.cookies.get('beyoracle_session')).toBeUndefined();
  expect(response.headers.get('x-middleware-request-cookie')).toContain('beyoracle_session=12345678-1234-4234-8234-123456789abc');
});

it('replaces invalid session identifiers without forwarding duplicate cookie values', () => {
  const response = middleware(new NextRequest('https://site.example/api/watchlist', { headers: { cookie: 'beyoracle_session=anonymous; other=value' } }));
  const session = response.cookies.get('beyoracle_session')!;
  expect(session.value).not.toBe('anonymous');
  expect(response.headers.get('x-middleware-request-cookie')).not.toContain('anonymous');
  expect(response.headers.get('x-middleware-request-cookie')).toContain(`beyoracle_session=${session.value}`);
});
