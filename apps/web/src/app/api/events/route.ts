import { getSessionId } from "@/lib/watchlist";
import {
  createSubscriber,
  EVENTS_CHANNEL,
  normalizeSaleEvent,
  parseEvent,
  redisEnabled,
  type SaleEvent,
} from "@beyoracle/events";
import type { Currency } from "@beyoracle/shared";
import {
  fetchRecentProductSales,
  fetchRecentSales,
  fetchSaleEventsSince,
} from "@beyoracle/pricing-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 25_000;
const DB_POLL_MS = 3_000;
const REPLAY_WINDOW_MS = 5 * 60 * 1000;

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}

function encodeEvent(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

function parseSinceParam(raw: string | null): Date {
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(Date.now() - REPLAY_WINDOW_MS);
}

function saleMatchesFilter(
  event: SaleEvent,
  partId?: string,
  productId?: string
): boolean {
  if (partId && event.partId !== partId) return false;
  if (productId && event.productId !== productId) return false;
  return true;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const partId = url.searchParams.get("partId") ?? undefined;
  const productId = url.searchParams.get("productId") ?? undefined;
  const sessionId = await getSessionId();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let polling = true;
      let subscriber: ReturnType<typeof createSubscriber> | null = null;
      let pollTimer: ReturnType<typeof setInterval> | null = null;
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      let since = parseSinceParam(url.searchParams.get("since"));
      const seenObservationIds = new Set<string>();

      const close = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        if (pollTimer) clearInterval(pollTimer);
        subscriber?.unsubscribe(EVENTS_CHANNEL).catch(() => undefined);
        subscriber?.quit().catch(() => undefined);
        req.signal.removeEventListener("abort", close);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      cleanup = close;

      const push = (payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encodeEvent(payload));
        } catch {
          close();
        }
      };

      const pushSale = (raw: SaleEvent) => {
        const event = normalizeSaleEvent(raw);
        if (!saleMatchesFilter(event, partId, productId)) return;
        if (seenObservationIds.has(event.observationId)) return;
        seenObservationIds.add(event.observationId);
        if (seenObservationIds.size > 1000) seenObservationIds.delete(seenObservationIds.values().next().value!);
        push(event);
      };

      const filterEvent = (raw: string) => {
        const event = parseEvent(raw);
        if (!event) return;
        if (event.type === "alert" && event.sessionId !== sessionId) {
          return;
        }
        if (event.type === "sale") {
          pushSale(event);
          return;
        }
        push(event);
      };

      const replayFromDb = async () => {
        try {
          const replay = await fetchSaleEventsSince({
            since,
            partId,
            productId,
            limit: 50,
          });
          for (const event of replay) {
            pushSale(event);
          }

          if (replay.length === 0 && productId) {
            const rows = await fetchRecentProductSales({ since, productId, limit: 20 });
            for (const row of rows) {
              pushSale({
                type: "sale",
                observationId: row.observationId,
                assetKind: "product",
                productId: row.productId,
                assetName: row.productName,
                productName: row.productName,
                source: row.source,
                title: row.title,
                price: row.price,
                currency: row.currency as Currency,
                condition: row.condition,
                observedAt: row.observedAt.toISOString(),
                url: row.url,
              });
            }
          } else if (replay.length === 0 && !productId) {
            const rows = await fetchRecentSales({ since, partId, limit: 20 });
            for (const row of rows) {
              pushSale({
                type: "sale",
                observationId: row.observationId,
                assetKind: "part",
                partId: row.partId,
                assetName: row.partName,
                partName: row.partName,
                source: row.source,
                title: row.title,
                price: row.price,
                currency: row.currency as Currency,
                condition: row.condition,
                observedAt: row.observedAt.toISOString(),
                url: row.url,
              });
            }
          }

          since = new Date();
        } catch {
          /* DB may be down — keep stream alive */
        }
      };

      heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
        } catch {
          close();
        }
      }, HEARTBEAT_MS);

      void replayFromDb().finally(() => { polling = false; });

      if (redisEnabled()) {
        subscriber = createSubscriber();
        subscriber.subscribe(EVENTS_CHANNEL).catch(() => undefined);
        subscriber.on("message", (_channel, message) => filterEvent(message));
      }

      pollTimer = setInterval(async () => {
        if (closed || polling) return;
        polling = true;
        try {
          const replay = await fetchSaleEventsSince({
            since,
            partId,
            productId,
            limit: 20,
          });
          for (const event of replay) {
            pushSale(event);
          }
          if (replay.length === 0 && productId) {
            const rows = await fetchRecentProductSales({ since, productId, limit: 20 });
            for (const row of rows) {
              pushSale({
                type: "sale",
                observationId: row.observationId,
                assetKind: "product",
                productId: row.productId,
                assetName: row.productName,
                productName: row.productName,
                source: row.source,
                title: row.title,
                price: row.price,
                currency: row.currency as Currency,
                condition: row.condition,
                observedAt: row.observedAt.toISOString(),
                url: row.url,
              });
            }
          } else if (replay.length === 0 && !productId) {
            const rows = await fetchRecentSales({ since, partId, limit: 20 });
            for (const row of rows) {
              pushSale({
                type: "sale",
                observationId: row.observationId,
                assetKind: "part",
                partId: row.partId,
                assetName: row.partName,
                partName: row.partName,
                source: row.source,
                title: row.title,
                price: row.price,
                currency: row.currency as Currency,
                condition: row.condition,
                observedAt: row.observedAt.toISOString(),
                url: row.url,
              });
            }
          }
          since = new Date();
        } catch {
          /* DB may be down — keep stream alive */
        } finally { polling = false; }
      }, DB_POLL_MS);

      req.signal.addEventListener("abort", close, { once: true });
      if (req.signal.aborted) close();
    },
    cancel() { cleanup(); },
  });

  return new Response(stream, { headers: sseHeaders() });
}
