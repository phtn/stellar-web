'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'
// import { useGoogleOneTap } from '@/hooks/useGoogleOneTap'
import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Suspense, useCallback } from 'react'
import { ChatHistorySection } from './sidebar/chat-history-section'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'
import { ReactNode } from 'react-markdown/lib/react-markdown'
import { useRouter } from 'next/navigation'
import VoiceToggle from './voice-toggle'
import { useVoiceCtx } from '@/ctx/voice'

export default function AppSidebar() {
  // const [showOneTap, setShowOneTap] = useState(false)
  // useGoogleOneTap(undefined, undefined, showOneTap)

  // const handleOneTap = useCallback(() => {
  //   setShowOneTap(true)
  // }, [])
  const router = useRouter()
  const toSentry = useCallback(() => {
    router.push('/sentry')
  }, [router])

  const { voiceState, toggleVoiceState } = useVoiceCtx()

  return (
    <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="flex flex-row justify-between border-b-2 border-stone-500/15 items-center">
        <Brand />
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent className="flex flex-col px-2.5 py-4 h-full">
        <div className="px-2">
          <VoiceToggle
            checked={voiceState}
            onCheckedChange={toggleVoiceState}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<ChatHistorySkeleton />}>
            <ChatHistorySection />
          </Suspense>
        </div>
        <Footer>
          <FeatureBadge fn={toSentry} icon="laptop" label="Sentry" />
        </Footer>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
const Brand = () => (
  <Link href="/" className="flex items-end gap-2.5 ps-3 pe-2 py-2">
    <Icon
      size={18}
      name="wing"
      className={cn('mb-0.5 dark:text-orange-300 -rotate-[9deg]')}
    />
    <span className="font-normal font-space tracking-[0.8em] text-[8px] uppercase dark:text-teal-100/90">
      Valkyrie
    </span>
    <Icon
      size={18}
      name="wing"
      className={cn(
        'mb-0.5 -scale-x-[1] -ml-1.5 dark:text-orange-300 rotate-[9deg]'
      )}
    />
  </Link>
)

const Footer = ({ children }: { children: ReactNode }) => <div>{children}</div>

interface UserProfileProps {
  signFn: VoidFunction
}
const UserProfile = ({ signFn }: UserProfileProps) => (
  <div className="my-4 flex flex-col mr-3">
    <button
      onClick={signFn}
      className="flex items-center p-4 space-x-6 hover:bg-sidebar-accent/40 rounded-2xl"
    >
      <Icon
        solid
        name="edit-straight"
        className="size-6 dark:text-teal-400 dark:bg-transparent bg-teal-300 text-teal-950 rounded-full"
      />
      <span className="tracking-snug font-medium font-space ">Sign in</span>
    </button>
  </div>
)

interface FeatureProps {
  icon: IconName
  label: string
  fn?: VoidFunction
}
const FeatureBadge = ({
  icon,
  label,
  fn = () => console.log('Feature Badge')
}: FeatureProps) => (
  <button onClick={fn} className="my-4 w-full flex flex-col gap-2">
    <div className="flex items-center px-3 space-x-6">
      <Icon
        solid
        name={icon}
        className="size-6 dark:text-teal-400 dark:bg-transparent bg-teal-300 text-teal-950 rounded-full"
      />
      <span className="tracking-snug font-medium font-space ">{label}</span>
    </div>
  </button>
)
