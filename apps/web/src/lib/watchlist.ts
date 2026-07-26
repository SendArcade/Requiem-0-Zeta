import { cookies } from "next/headers";
import type { Condition, SourceId } from "@beyoracle/shared";
import { DEFAULT_ORACLE_CONDITIONS, SOURCES } from "@beyoracle/shared";

export const SESSION_COOKIE = "beyoracle_session";

export async function getSessionId(): Promise<string> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? "anonymous";
}

export function parseSourcesParam(param: string | null): SourceId[] {
  if (!param) return [...SOURCES];
  const ids = param.split(",").filter(Boolean);
  const valid = ids.filter((s): s is SourceId =>
    (SOURCES as readonly string[]).includes(s)
  );
  return valid.length > 0 ? valid : [...SOURCES];
}

export function parseConditionsParam(param: string | null): Condition[] {
  if (!param) return [...DEFAULT_ORACLE_CONDITIONS];
  const ids = param.split(",").filter(Boolean);
  const valid = ids.filter((c): c is Condition =>
    ["sealed", "like_new", "used", "unknown"].includes(c)
  );
  return valid.length > 0 ? valid : [...DEFAULT_ORACLE_CONDITIONS];
}
