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
import { ClearHistoryAction } from './clear-history-action'

// interface ChatHistoryClientProps {} // Removed empty interface

function formatDate(date: any) {
  if (!date) return ''
  // Firestore Timestamp object
  if (date.seconds) {
    date = new Date(date.seconds * 1000)
  } else if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date)
  }
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit'
  })
}

export function ChatHistoryClient() {
  // Removed props from function signature
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
        <div className="flex items-center justify-between w-full">
          <SidebarGroupLabel className="p-0">History</SidebarGroupLabel>
          <ClearHistoryAction empty={isHistoryEmpty} />
        </div>
      </SidebarGroup>
      <div className="flex-1 overflow-y-auto mb-2 relative">
        {isHistoryEmpty && !isPending ? (
          <div className="px-2 text-foreground/30 text-sm text-center py-4">
            No search history
          </div>
        ) : (
          <ul className="px-2 py-2">
            {chats.map(
              (chat: any) =>
                chat && (
                  <li
                    key={chat.id}
                    className="mb-2 flex items-center justify-between group"
                  >
                    <Link
                      href={`/chat/${chat.id}`}
                      className="block px-2 py-1 rounded hover:bg-muted/30 truncate font-medium flex-1"
                    >
                      {chat.title}
                    </Link>
                    <div className="text-xs text-muted-foreground pl-2">
                      {chat.assistantName && (
                        <span className="mr-2">{chat.assistantName}</span>
                      )}
                    </div>
                    <button
                      className="ml-2 rounded text-red-500 opacity-0 group-hover:opacity-100 transition"
                      title="Delete conversation"
                      onClick={async e => {
                        e.preventDefault()
                        await deleteConversation(chat.id)
                        setChats(chats =>
                          chats.filter((c: any) => c.id !== chat.id)
                        )
                        // if (confirm('Delete this conversation?')) {
                        //   await deleteConversation(chat.id)

                        // }
                      }}
                    >
                      x
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
