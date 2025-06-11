import { useState } from 'react'
import { useToggle } from './use-toggle'

export const useChatControls = () => {
  const [isLoading, setLoading] = useState(false)
  const { on, toggle } = useToggle()
  return { on, isLoading, toggle }
}
