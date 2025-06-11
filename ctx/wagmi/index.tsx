'use client'

import { wagmiAdapter } from './config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { baseSepolia, mainnet, sepolia, base } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
const projectId = process.env.NEXT_PUBLIC_REOWN_ID!
// src/theme/openAITheme.ts
const openAIThemeVars = {
  '--w3m-accent': '#14b8a6', // teal accent for buttons & icons
  // '--w3m-color-mix': '#000000', // base for subtle color blending
  '--w3m-color-mix-strength': 5, // light blending for modern minimal look
  '--w3m-font-family': 'Space Grotesk, sans-serif',
  '--w3m-font-size-master': '8px', // fluid, readable font sizing
  '--w3m-border-radius-master': '2px', // soft, rounded corners
  '--w3m-z-index': 9999 // ensure modals are on top
}
// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

const url =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://valkyrie-two.vercel.app'

// Set up metadata
const metadata = {
  name: 'Valkyrie',
  description: 'Assistant',
  url: url, // origin must match your domain & subdomain
  icons: ['/images/s-wing.svg']
}

// Create the modal
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [sepolia, baseSepolia, mainnet, base],
  defaultNetwork: mainnet,
  metadata: metadata,
  features: {
    analytics: true,
    emailShowWallets: true
  },
  themeMode: 'light',
  themeVariables: openAIThemeVars
})

function WagmiContext({
  children,
  cookies
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  )

  return (
    <WagmiProvider
      reconnectOnMount
      initialState={initialState}
      config={wagmiAdapter.wagmiConfig as Config}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default WagmiContext
