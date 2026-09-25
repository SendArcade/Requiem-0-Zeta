import { useEffect, useState } from 'react'

/** Phone / small tablet — prefer posters over WebGL and skip heavy motion. */
export function useCompact(query = '(max-width: 700px)') {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setCompact(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return compact
}

export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches
      : false,
  )

  useEffect(() => {
    const coarseMq = window.matchMedia('(pointer: coarse)')
    const fineMq = window.matchMedia('(any-pointer: fine)')
    const onChange = () => setCoarse(coarseMq.matches && !fineMq.matches)
    onChange()
    coarseMq.addEventListener('change', onChange)
    fineMq.addEventListener('change', onChange)
    return () => {
      coarseMq.removeEventListener('change', onChange)
      fineMq.removeEventListener('change', onChange)
    }
  }, [])

  return coarse
}
