import art from '../data/art.json'

export const SPIRITS = '/assets/game/spirits'

/**
 * Matches a listing to its beast spirit art. Names differ between the two
 * exports ("Cho-Z Valtryek" vs `spirit_thumb_valtryek`), so the longest spirit
 * key contained in the listing name wins — that beats "Dragon" hijacking
 * "Ace Dragon".
 */
const SPIRIT_KEYS = art.spirits
  .flatMap((s) => {
    const flat = s.beast.replace(/[^a-z0-9]/gi, '').toLowerCase()
    // Spirit names carry a system prefix the listing does not — `archerHercules`
    // for "Hercules H4", `drainFafnir` for "Mirage Fafnir F6" — so the bare
    // beast word is a key too.
    const words = s.beast.trim().split(/\s+/)
    const beast = words[words.length - 1].toLowerCase()
    return beast !== flat ? [{ file: s.file, key: flat }, { file: s.file, key: beast }] : [{ file: s.file, key: flat }]
  })
  .filter((s) => s.key.length > 3)
  // Longest first, so "aceDragon" wins over "dragon" on "Ace Dragon D5".
  .sort((a, b) => b.key.length - a.key.length)

const cache = new Map<string, string | undefined>()

/** Spirit art filename for a bey name, or undefined when nothing was shipped. */
export function spiritFor(name: string) {
  if (cache.has(name)) return cache.get(name)
  const flat = name.replace(/[^a-z0-9]/gi, '').toLowerCase()
  const hit = SPIRIT_KEYS.find((s) => flat.includes(s.key))?.file
  cache.set(name, hit)
  return hit
}

/** Full URL, or undefined — saves every caller re-joining the path. */
export const spiritUrl = (name: string) => {
  const file = spiritFor(name)
  return file ? `${SPIRITS}/${file}` : undefined
}
