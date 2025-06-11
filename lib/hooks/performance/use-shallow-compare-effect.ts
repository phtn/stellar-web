import { DependencyList, EffectCallback, useEffect, useRef } from 'react'

/**
 * Custom hook that performs shallow comparison on dependencies
 * Only triggers the effect when dependencies actually change
 */
export function useShallowCompareEffect(
  callback: EffectCallback,
  dependencies: DependencyList
) {
  const prevDepsRef = useRef<DependencyList>()

  useEffect(() => {
    const hasDepsChanged =
      !prevDepsRef.current ||
      dependencies.length !== prevDepsRef.current.length ||
      dependencies.some((dep, i) => dep !== prevDepsRef.current![i])

    if (hasDepsChanged) {
      prevDepsRef.current = dependencies
      return callback()
    }
  }, [dependencies, callback])
}
