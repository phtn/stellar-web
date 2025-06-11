'use client'

import { type ReactNode } from 'react'
import { ConfigCtxProvider } from './config'
import { type State, WagmiProvider } from 'wagmi'
import { config } from './wagmi/config'
interface ProviderProps {
  children: ReactNode
  initialState: State | undefined
}
export const Providers = ({ children, initialState }: ProviderProps) => {
  return (
    <ConfigCtxProvider>
      <WagmiProvider config={config} initialState={initialState}>
        {children}
      </WagmiProvider>
    </ConfigCtxProvider>
  )
}
