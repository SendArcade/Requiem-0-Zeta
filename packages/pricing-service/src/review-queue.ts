import { randomUUID } from "node:crypto";
import {
  getDb,
  matchReviewQueue,
  matches,
  observations,
  productMatches,
} from "@beyoracle/db";
import { eq } from "drizzle-orm";
import type { ObservationDTO } from "@beyoracle/shared";
import {
  publishSaleIfNew,
  publishProductSaleIfNew,
  recomputeOracleSnapshot,
  recomputeProductOracleSnapshot,
} from "./persist.js";

export async function approveReviewQueueItem(
  id: string
): Promise<{ partId: string | null; productId: string | null }> {
  const db = getDb();
  const [item] = await db
    .select()
    .from(matchReviewQueue)
    .where(eq(matchReviewQueue.id, id))
    .limit(1);

  if (!item || item.status !== "pending") {
    throw new Error("Review item not found or already resolved");
  }

  await db.delete(matches).where(eq(matches.observationId, item.observationId));
  await db
    .delete(productMatches)
    .where(eq(productMatches.observationId, item.observationId));

  let partId: string | null = null;
  let productId: string | null = null;

  if (item.suggestedProductId) {
    productId = item.suggestedProductId;
    await db.insert(productMatches).values({
      id: randomUUID(),
      observationId: item.observationId,
      productId: item.suggestedProductId,
      confidence: item.confidence,
      method: item.method,
    });
    await recomputeProductOracleSnapshot(item.suggestedProductId);

    const [obs] = await db
      .select()
      .from(observations)
      .where(eq(observations.id, item.observationId))
      .limit(1);
    if (obs) {
      const observation: ObservationDTO = {
        id: obs.id,
        source: obs.source,
        externalId: obs.externalId,
        title: obs.title,
        price: obs.price,
        currency: obs.currency as ObservationDTO["currency"],
        status: obs.status,
        condition: obs.condition,
        url: obs.url,
        observedAt: obs.observedAt,
        rawJson: obs.rawJson,
      };
      await publishProductSaleIfNew(observation, item.suggestedProductId, false);
    }
  } else if (item.suggestedPartId) {
    partId = item.suggestedPartId;
    await db.insert(matches).values({
      id: randomUUID(),
      observationId: item.observationId,
      partId: item.suggestedPartId,
      confidence: item.confidence,
      method: item.method,
    });
    await recomputeOracleSnapshot(item.suggestedPartId);

    const [obs] = await db
      .select()
      .from(observations)
      .where(eq(observations.id, item.observationId))
      .limit(1);
    if (obs) {
      const observation: ObservationDTO = {
        id: obs.id,
        source: obs.source,
        externalId: obs.externalId,
        title: obs.title,
        price: obs.price,
        currency: obs.currency as ObservationDTO["currency"],
        status: obs.status,
        condition: obs.condition,
        url: obs.url,
        observedAt: obs.observedAt,
        rawJson: obs.rawJson,
      };
      await publishSaleIfNew(observation, item.suggestedPartId, false);
    }
  } else {
    throw new Error("Review item has no suggested match target");
  }

  await db
    .update(matchReviewQueue)
    .set({ status: "approved" })
    .where(eq(matchReviewQueue.id, id));

  return { partId, productId };
}

export async function rejectReviewQueueItem(id: string): Promise<void> {
  const db = getDb();
  const [item] = await db
    .select({ id: matchReviewQueue.id, status: matchReviewQueue.status })
    .from(matchReviewQueue)
    .where(eq(matchReviewQueue.id, id))
    .limit(1);

  if (!item || item.status !== "pending") {
    throw new Error("Review item not found or already resolved");
  }

  await db
    .update(matchReviewQueue)
    .set({ status: "rejected" })
    .where(eq(matchReviewQueue.id, id));
}
