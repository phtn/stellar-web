// Dynamic conversation page for /chat/[id]
import { Chat } from '@/components/chat'
import { getConversation, getMessages } from '@/lib/firebase/conversations'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import { Suspense, useMemo } from 'react'

type Params = Promise<{ id: string }>
export default async function ChatPage(props: { params: Params }) {
  const { id } = await props.params
  // Fetch conversation metadata
  const conversation = await getConversation(id)
  if (!conversation) {
    notFound()
  }
  // Fetch messages and map to correct shape
  const messagesRaw = await getMessages(id)
  const messages = messagesRaw.map((msg: any) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    audioUrl: msg.audioUrl || null
    // add other fields if needed
  }))

  const date = useMemo(
    () => format(conversation.createdAt, 'Pp'),
    [conversation.createdAt]
  )

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold mb-1 truncate">
          {conversation.title || 'Conversation'}
        </h1>
        <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
          {conversation.assistantName && (
            <span>Assistant: {conversation.assistantName}</span>
          )}
          {conversation.createdAt && <span>Created: {date}</span>}
        </div>
      </div>
      <Suspense fallback={<div>Loading chat...</div>}>
        {/* Pass conversationId and messages to the Chat UI */}
        <Chat id={id} savedMessages={messages} />
      </Suspense>
    </div>
  )
}
