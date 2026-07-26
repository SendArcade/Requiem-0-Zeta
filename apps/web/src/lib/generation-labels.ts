import type { Generation } from "@beyoracle/shared";

/** Client-safe — do not import @beyoracle/catalog in "use client" components. */
export const GENERATION_LABELS: Record<Generation, string> = {
  plastic: "Plastic (Original)",
  metal: "Metal Fight",
  burst: "Burst",
  x: "X",
};
