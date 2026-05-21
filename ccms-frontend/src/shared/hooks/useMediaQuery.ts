'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(query)
    const updateMatch = () => setMatches(mediaQuery.matches)

    updateMatch()
    mediaQuery.addEventListener('change', updateMatch)

    return () => mediaQuery.removeEventListener('change', updateMatch)
  }, [query])

  return matches
}
