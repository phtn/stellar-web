'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

/**
 * Custom hook to track media query matches.
 * @param query - The media query string (e.g., '(max-width: 767px)').
 * @param defaultValue - Default value for SSR (optional).
 * @returns boolean - True if the media query matches, false otherwise.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  // For modern React 18+ with better concurrent features support
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === 'undefined') {
        return () => {}
      }
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    [query]
  )

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }
    return window.matchMedia(query).matches
  }, [query, defaultValue])

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue])

  // Use useSyncExternalStore for better React 18+ compatibility
  const matches = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  return matches
}

// Fallback implementation for older React versions
export function useMediaQueryLegacy(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)

    // Set initial state
    setMatches(mql.matches)

    // Add listener
    mql.addEventListener('change', handler)

    // Cleanup listener on unmount
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}
