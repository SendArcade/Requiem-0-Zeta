import { Redis } from "ioredis";
import type { BeyoracleEvent } from "./types.js";
import { EVENTS_CHANNEL } from "./types.js";

export * from "./types.js";

let publisher: Redis | null = null;

export function getRedisUrl(): string {
  return process.env.REDIS_URL ?? "redis://localhost:6379";
}

export function redisEnabled(): boolean {
  return process.env.REDIS_ENABLED !== "0";
}

export function getPublisher(): Redis {
  publisher ??= new Redis(getRedisUrl(), { maxRetriesPerRequest: null });
  return publisher;
}

export function createSubscriber(): Redis {
  return new Redis(getRedisUrl(), { maxRetriesPerRequest: null });
}

export async function publishEvent(event: BeyoracleEvent): Promise<void> {
  if (!redisEnabled()) return;
  try {
    await getPublisher().publish(EVENTS_CHANNEL, JSON.stringify(event));
  } catch (err) {
    console.warn("[events] publish failed:", (err as Error).message);
  }
}

export async function closePublisher(): Promise<void> {
  if (publisher) {
    await publisher.quit();
    publisher = null;
  }
}
