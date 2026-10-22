/** Only fetched finite valuations count as available marks. Mapping alone is insufficient. */
export function hasOracleValue(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function compareOracleAvailability(
  a: { id: string },
  b: { id: string },
  values: Record<string, number | null>,
): number {
  return Number(hasOracleValue(values[b.id])) - Number(hasOracleValue(values[a.id]))
}
