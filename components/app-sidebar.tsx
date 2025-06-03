'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { ChatHistorySection } from './sidebar/chat-history-section'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'

export default function AppSidebar() {
  // const { voiceEngine, setVoiceEngine, outputMode, setOutputMode } =
  //   useVoiceSettings()

  return (
    <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="flex flex-row justify-between border-b-2 border-stone-500/15 items-center">
        <Link href="/" className="flex items-end gap-2.5 px-2 py-2">
          <Icon
            size={16}
            name="wing"
            className={cn('mb-1 dark:text-orange-300')}
          />
          <span className="font-medium font-space tracking-[0.5em] text-xs uppercase dark:text-orange-100/50">
            Valkyrie
          </span>
        </Link>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent className="flex flex-col px-2 py-4 h-full">
        <div className="my-4 flex flex-col gap-2">
          <div className="flex items-center px-3 space-x-3">
            <Icon
              solid
              name="voice-solid"
              className="size-6 dark:text-teal-400 dark:bg-transparent bg-teal-300 text-teal-950 rounded-full"
            />
            <span className="tracking-snug font-medium font-space ">
              Voice Enabled
            </span>
          </div>
        </div>
        <SidebarMenu className="ps-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/" className="flex items-center gap-2 opacity-80">
                <Plus className="size-4" />
                <span>New</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<ChatHistorySkeleton />}>
            <ChatHistorySection />
          </Suspense>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
