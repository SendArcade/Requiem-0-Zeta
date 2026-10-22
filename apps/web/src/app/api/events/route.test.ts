import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { createSubscriber } from '@beyoracle/events';
import { fetchSaleEventsSince } from '@beyoracle/ingest';

vi.mock('@/lib/watchlist', () => ({ getSessionId: async () => 'own-session' }));
vi.mock('@beyoracle/events', () => ({
  createSubscriber: vi.fn(), EVENTS_CHANNEL: 'events', redisEnabled: () => true,
  normalizeSaleEvent: (event: unknown) => event,
  parseEvent: (raw: string) => JSON.parse(raw),
}));
vi.mock('@beyoracle/ingest', () => ({
  fetchSaleEventsSince: vi.fn(async () => []), fetchRecentSales: async () => [], fetchRecentProductSales: async () => [],
}));
let subscriber: EventEmitter & { subscribe: ReturnType<typeof vi.fn>; unsubscribe: ReturnType<typeof vi.fn>; quit: ReturnType<typeof vi.fn> };
beforeEach(() => {
  vi.useFakeTimers();
  subscriber = Object.assign(new EventEmitter(), { subscribe: vi.fn(async () => {}), unsubscribe: vi.fn(async () => {}), quit: vi.fn(async () => {}) });
  vi.mocked(createSubscriber).mockReturnValue(subscriber as unknown as ReturnType<typeof createSubscriber>);
  vi.mocked(fetchSaleEventsSince).mockClear();
});
afterEach(() => vi.useRealTimers());

describe('event stream isolation and lifecycle', () => {
  it('uses the server session for alerts even when another session is requested', async () => {
    const response = await GET(new Request('https://site.example/api/events?sessionId=other-session'));
    const reader = response.body!.getReader();
    subscriber.emit('message', 'events', JSON.stringify({ type: 'alert', sessionId: 'other-session', id: 'private' }));
    subscriber.emit('message', 'events', JSON.stringify({ type: 'alert', sessionId: 'own-session', id: 'mine' }));
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain('mine'); expect(text).not.toContain('private');
    await reader.cancel();
  });
  it('releases Redis and timers when the reader disconnects', async () => {
    const response = await GET(new Request('https://site.example/api/events'));
    await response.body!.cancel();
    const calls = vi.mocked(fetchSaleEventsSince).mock.calls.length;
    await vi.advanceTimersByTimeAsync(30000);
    expect(subscriber.quit).toHaveBeenCalledOnce();
    expect(subscriber.unsubscribe).toHaveBeenCalledOnce();
    expect(fetchSaleEventsSince).toHaveBeenCalledTimes(calls);
  });
  it('does not overlap database polls when one request is slow', async () => {
    let finish!: (rows: never[]) => void;
    vi.mocked(fetchSaleEventsSince).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const response = await GET(new Request('https://site.example/api/events'));
    await vi.advanceTimersByTimeAsync(12000);
    expect(fetchSaleEventsSince).toHaveBeenCalledTimes(1);
    finish([]);
    await response.body!.cancel();
  });
});
