'use client'

import { useState } from 'react'

export interface useCopyProps {
  timeout?: number
}

export function useCopy({ timeout = 2000 }: useCopyProps) {
  const [isCopied, setIsCopied] = useState<Boolean>(false)

  const copy = (value: string) => {
    if (typeof window === 'undefined' || !navigator.clipboard?.writeText) {
      return
    }

    if (!value) {
      return
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)

      setTimeout(() => {
        setIsCopied(false)
      }, timeout)
    })
  }

  return { isCopied, copy }
}
