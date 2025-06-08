'use client'

import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar'
import {
  deleteConversation,
  getConversationsForUser
} from '@/lib/firebase/conversations'
import { Chat } from '@/lib/types'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChatHistorySkeleton } from './chat-history-skeleton'
import { Badge } from '../ui/badge'

export function ChatHistoryClient() {
  const [chats, setChats] = useState<Chat[]>([])
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
      console.error('Failed to load conversations:', error)
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
          <ul className="py-5">
            {chats.map(
              (chat: any) =>
                chat && (
                  <li
                    key={chat.id}
                    className="mb-2 flex items-center justify-between group/li transition-all duration-500 ease-in-out"
                  >
                    <Link
                      href={`/chat/${chat.id}`}
                      className="px-4 py-1 rounded-lg dark:hover:bg-sidebar-accent/60 hover:bg-sidebar-border group/link space-x-3 flex-1 flex items-center"
                    >
                      <span className="font-medium text-base scale-105 font-space dark:text-sidebar-foreground/70 text-sidebar-foreground group-hover/link:text-sidebar-foreground truncate tracking-snug">
                        {chat.title}
                      </span>
                      <Badge
                        variant="default"
                        className="flex items-center group/badge h-5 px-1 rounded-lg bg-orange-200/60 dark:bg-zinc-900 border-[0.33px] dark:border-zinc-700"
                      >
                        <span className="font-sans group-hover/badge:text-orange-200 dark:text-teal-300/80 text-xs text-sidebar-foreground uppercase">
                          {chat.assistantName}
                        </span>
                        <span className="font-light hidden text-sm text-indigo-200 tracking-tight">
                          {chat.assistantName}
                        </span>
                      </Badge>
                    </Link>

                    <button
                      className="px-4 rounded text-rose-500 opacity-0 group-hover:opacity-100 transition"
                      title="Delete conversation"
                      onClick={async e => {
                        e.preventDefault()
                        await deleteConversation(chat.id)
                        setChats(chats =>
                          chats.filter((c: any) => c.id !== chat.id)
                        )
                      }}
                    >
                      <span className="text-lg font-medium text-sidebar-primary-foreground/30 group-hover/li:text-sidebar-primary-foreground">
                        -
                      </span>
                    </button>
                  </li>
                )
            )}
          </ul>
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
