'use client'
import { ChatHistoryClient } from './chat-history-client'

export function ChatHistorySection() {
  const enableSaveChatHistory =
    process.env.NEXT_PUBLIC_ENABLE_SAVE_CHAT_HISTORY === 'true'
  if (!enableSaveChatHistory) {
    return null
  }

  return <ChatHistoryClient />
}
