'use client'
import { Chat } from '@/components/chat'
import { MessageCtx, MessageCtxProvider } from '@/ctx/chat/message-ctx'
import { getMessages } from '@/lib/firebase/conversations'
import { Message } from 'ai'
import { useContext, useEffect, useState } from 'react'

interface Props {
  id: string
}
interface MessagesProps {
  id: string
  initialMessages: Message[]
}
export const ChatMessages = ({ id }: Props) => {
  const ctx = useContext(MessageCtx)
  const [messages, setMessages] = useState<Message[] | undefined>(
    ctx?.allMessages
  )
  const props = { id, initialMessages: messages } as MessagesProps

  useEffect(() => {
    if (!messages) getMessages(id).then(setMessages).catch(console.error)
  }, [id, messages])

  return (
    <MessageCtxProvider messages={ctx?.allMessages ?? []}>
      <Messages {...props} />
    </MessageCtxProvider>
  )
}

const Messages = (props: MessagesProps) => {
  return (
    <div className="h-full flex flex-col min-h-0">
      <Chat {...props} />
    </div>
  )
}
