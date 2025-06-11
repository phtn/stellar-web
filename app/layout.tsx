import AppSidebar from '@/components/app-sidebar'
import ArtifactRoot from '@/components/artifact/artifact-root'
import Header from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
// import { Analytics } from '@vercel/analytics/next'
// import AuthGate from '@/components/AuthGate'
import { Providers } from '@/ctx'
import type { Metadata, Viewport } from 'next'
import { Inter as FontSans, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { cookieToInitialState } from 'wagmi'
import { headers } from 'next/headers'
import { config } from '@/ctx/wagmi/config'
import WagmiContext from '@/ctx/wagmi'
import { Toasts } from '@/ctx/toast'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans'
})
const space = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space'
})
const title = 'Stellar'
const description =
  'A fully open-source AI-powered answer engine with a generative UI.'

const url =
  process.env.NODE_ENV === 'development'
    ? `http://${process.env.NODE_ENV}:3000`
    : 'https://valkyrie-two.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  openGraph: {
    title,
    description
  },
  icons: ['/images/s-wing.svg'],
  twitter: {
    title,
    description,
    card: 'summary_large_image',
    creator: '@xpriori'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  let user = null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient()
    const {
      data: { user: supabaseUser }
    } = await supabase.auth.getUser()
    user = supabaseUser
  }

  const initialState = cookieToInitialState(
    config,
    (await headers()).get('cookie')
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen h-full flex flex-col font-sans antialiased',
          fontSans.variable,
          space.variable
        )}
        style={{ minHeight: '100vh', height: '100vh' }}
      >
        {/* <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" /> */}
        {/* <AuthGate /> */}
        <WagmiContext cookies={''}>
          <Providers initialState={initialState}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SidebarProvider defaultOpen>
                <AppSidebar />
                <div className="flex flex-col flex-1 h-full min-h-0">
                  <Header user={user} />
                  <main className="flex flex-1 min-h-0 h-full">
                    <ArtifactRoot>{children}</ArtifactRoot>
                  </main>
                </div>
              </SidebarProvider>
              <Toasts />
              {/* <Analytics /> */}
            </ThemeProvider>
          </Providers>
        </WagmiContext>
      </body>
    </html>
  )
}
