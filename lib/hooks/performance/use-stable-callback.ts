import { useCallback, useRef } from 'react'

/**
 * Returns a stable callback that maintains the same reference across renders
 * while always calling the latest function implementation.
 * This prevents unnecessary re-renders in child components that depend on callbacks.
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback)

  // Update the ref to the latest callback on every render
  callbackRef.current = callback

  // Return a stable callback that calls the latest function

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args) => callbackRef.current(...args)) as T, [])
}
