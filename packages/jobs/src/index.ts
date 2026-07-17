import type { JobName } from "./names.js";
import { JOB_SCHEMAS } from "./schemas.js";

/** Validate payload before enqueue — invalid jobs never enter the queue. */
export function parseJobPayload<N extends JobName>(
  name: N,
  data: unknown
): (typeof JOB_SCHEMAS)[N] extends { parse: (d: unknown) => infer R } ? R : never {
  const schema = JOB_SCHEMAS[name as keyof typeof JOB_SCHEMAS];
  if (!schema) {
    throw new Error(`No schema registered for job: ${name}`);
  }
  return schema.parse(data) as never;
}

export * from "./names.js";
export * from "./schemas.js";
export * from "./config.js";
