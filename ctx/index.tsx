import { type ReactNode } from 'react'
import { ConfigCtxProvider } from './config'

export const Providers = ({ children }: { children: ReactNode }) => {
  return <ConfigCtxProvider>{children}</ConfigCtxProvider>
}
