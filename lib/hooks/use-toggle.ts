import { useCallback, useState } from 'react'

export const useToggle = (
  state?: boolean
): { on: boolean; toggle: VoidFunction } => {
  const [on, setOn] = useState(state ?? false)
  const toggle = useCallback(() => {
    setOn(prev => !prev)
  }, [])
  return { on, toggle }
}
