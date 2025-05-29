'use client'

import { createContext, useCallback, useMemo, type ReactNode } from 'react'

interface ConfigCtxValues {
  getFileUri: (filename: string) => string
}
export const ConfigCtx = createContext<ConfigCtxValues | null>(null)
const base = 'https://firebasestorage.googleapis.com/v0/b'
const bucket = process.env.NEXT_PUBLIC_STORAGEBUCKET
const dir = 'o/public%2F'
export const ConfigCtxProvider = ({ children }: { children: ReactNode }) => {
  const getFileUri = useCallback(
    (filename: string) => `${base}/${bucket}/${dir}${filename}?alt=media`,
    []
  )
  const value = useMemo(
    () => ({
      getFileUri
    }),
    [getFileUri]
  )

  return <ConfigCtx.Provider value={value}>{children}</ConfigCtx.Provider>
}
