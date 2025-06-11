'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface useCopyProps {
  timeout?: number
}

export function useCopy({ timeout = 2000 }: useCopyProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const copy = useCallback(
    (value: string) => {
      if (typeof window === 'undefined' || !navigator.clipboard?.writeText) {
        return
      }

      if (!value) {
        return
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      navigator.clipboard.writeText(value).then(() => {
        setIsCopied(true)

        timeoutRef.current = setTimeout(() => {
          setIsCopied(false)
          timeoutRef.current = null
        }, timeout)
      })
    },
    [timeout]
  )

  return { isCopied, copy }
}
