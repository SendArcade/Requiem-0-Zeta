import { describe, expect, it } from 'vitest'
import { compareOracleAvailability, hasOracleValue } from './oracleAvailability'

describe('catalogue mark availability', () => {
  it('puts actual prices ahead of mapped entries without a mark', () => {
    const listings = [{ id: 'empty' }, { id: 'priced' }, { id: 'pending' }, { id: 'zero' }]
    const values = { empty: null, priced: 1500, zero: 0 }
    expect([...listings].sort((a, b) => compareOracleAvailability(a, b, values)).map(x => x.id))
      .toEqual(['priced', 'zero', 'empty', 'pending'])
    expect(listings.filter(x => hasOracleValue(values[x.id as keyof typeof values]))).toHaveLength(2)
  })

  it('does not count invalid or missing prices as product marks', () => {
    for (const value of [null, undefined, NaN, Infinity]) expect(hasOracleValue(value)).toBe(false)
  })
})
