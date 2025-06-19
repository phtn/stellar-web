'use client'

import { SidebarGroup } from '@/components/ui/sidebar'
import {
  deleteConversation,
  getConversationsForUser
} from '@/lib/firebase/conversations'
import { IConversation } from '@/lib/firebase/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition
} from 'react'
import { toast } from 'sonner'
import { Badge } from '../ui/badge'
import { ChatHistorySkeleton } from './chat-history-skeleton'
import { HyperList } from '../hyper/list'

export function ChatHistoryClient() {
  const [chats, setChats] = useState<IConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()

  // Fetch conversations from Firestore
  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual user id from auth
      const userId = 'demo-user'
      const conversations = await getConversationsForUser(userId)
      setChats(conversations)
    } catch (error) {
      toast.error('Failed to load chat history.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    const handleHistoryUpdate = () => {
      startTransition(() => {
        fetchConversations()
      })
    }
    window.addEventListener('chat-history-updated', handleHistoryUpdate)
    return () => {
      window.removeEventListener('chat-history-updated', handleHistoryUpdate)
    }
  }, [fetchConversations])

  const isHistoryEmpty = !isLoading && !chats.length

  const handleDelete = useCallback(
    (id: string) => async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      await deleteConversation(id)
      setChats(chats => chats.filter(prev => prev.id !== id))
    },
    []
  )

  const ConvItem = (item: IConversation) => (
    <div className="flex items-center justify-between group/li">
      <Link
        href={`/chat/${item.id}`}
        className="ps-2.5 overflow-hidden rounded-lg dark:hover:bg-sidebar-accent/60 transition-all duration-500 ease-in-out hover:bg-sidebar-border group/link space-x-3 flex-1 flex items-center"
      >
        <div
          className={cn(
            'h-10 flex items-center font-medium font-space truncate tracking-snug',
            'text-base text-sidebar-foreground dark:text-sidebar-foreground/70 leading-none',
            'group-hover/li:scale-110 scale-105 group-hover/li:text-sidebar-foreground',
            'transition-all duration-200 ease-out'
          )}
        >
          {item.title}
        </div>
        <Badge
          variant="default"
          className="flex items-center group/badge h-5 px-1 rounded-lg bg-orange-200/60 dark:bg-zinc-900 border-[0.33px] dark:border-zinc-700"
        >
          <span className="font-sans group-hover/badge:text-orange-200 dark:text-teal-300/80 text-xs text-sidebar-foreground uppercase">
            {item.assistant}
          </span>
          <span className="font-light hidden text-sm text-indigo-200 tracking-tight">
            {item.assistant}
          </span>
        </Badge>
      </Link>

      <button
        className="px-1 rounded opacity-0 group-hover:opacity-100 translate-x-3 group-hover:translate-x-0 transition-all duration-300"
        title="Delete conversation"
        onClick={handleDelete(item.id!)}
      >
        <span className="text-2xl font-medium dark:text-sidebar-primary-foreground/30 text-orange-300 group-hover/li:text-orange-400 dark:group-hover/li:text-sidebar-primary-foreground/80 group-hover/li:scale-150">
          ・
        </span>
      </button>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 h-full">
      <SidebarGroup>
        {/* <div className="flex items-center justify-between w-full">
          <SidebarGroupLabel className="p-0">History</SidebarGroupLabel>
          <ClearHistoryAction empty={isHistoryEmpty} />
        </div> */}
      </SidebarGroup>
      <div className="flex-1 overflow-y-auto mb-2 relative">
        {isHistoryEmpty && !isPending ? (
          <div className="px-2 text-foreground/30 text-sm text-center py-4">
            No search history
          </div>
        ) : (
          <HyperList container="py-5" data={chats} component={ConvItem} />
        )}
        <div ref={loadMoreRef} style={{ height: '1px' }} />
        {(isLoading || isPending) && (
          <div className="py-2">
            <ChatHistorySkeleton />
          </div>
        )}
      </div>
    </div>
  )
}
