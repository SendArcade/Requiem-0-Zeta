/**
 * Device tier + “potato mode” — dial back GPU/motion so low-end phones stay smooth.
 */

export type DeviceTier = 'high' | 'mid' | 'potato'

function hasSaveData() {
  // @ts-expect-error NetworkInformation is not on all TS libs
  return Boolean(navigator.connection?.saveData)
}

function roughMemoryGb() {
  // @ts-expect-error deviceMemory is Chromium-only
  const mem = navigator.deviceMemory as number | undefined
  return mem ?? 4
}

function hwConcurrency() {
  return navigator.hardwareConcurrency || 4
}

export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'mid'
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'potato'
  if (hasSaveData()) return 'potato'

  const mem = roughMemoryGb()
  const cores = hwConcurrency()
  const coarse =
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(any-pointer: fine)').matches
  const narrow = window.matchMedia('(max-width: 700px)').matches

  if (mem <= 2 || (cores <= 4 && coarse && narrow)) return 'potato'
  if (mem <= 4 || (cores <= 6 && narrow)) return 'mid'
  return 'high'
}

export function isPotatoDevice() {
  return detectDeviceTier() === 'potato'
}

/** Runtime flags consumers can branch on without re-detecting. */
export function perfFlags(tier: DeviceTier = detectDeviceTier()) {
  return {
    tier,
    allowWebGL: tier !== 'potato',
    allowAsciiFx: tier === 'high',
    allowParallax: tier === 'high',
    allowClickSpark: tier === 'high',
    allowMagnet: tier !== 'potato',
    preferPosters: tier !== 'high',
    maxPixelRatio: tier === 'high' ? 1.85 : tier === 'mid' ? 1.25 : 1,
  } as const
}
