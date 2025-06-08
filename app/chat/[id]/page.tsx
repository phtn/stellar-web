import { Chat } from '@/components/chat'
import { getConversation, getMessages } from '@/lib/firebase/conversations'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Conversation, IConversation } from './content'
import { Icon } from '@/lib/icons'

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

  return (
    <div className="max-w-2x mx-auto py-8 px-4">
      <Conversation conversation={conversation as IConversation} />
      <Suspense
        fallback={
          <Icon name="spinners-ring" className="size-4 text-sidebar-accent" />
        }
      >
        <div className="h-full flex flex-col min-h-0">
          <Chat id={id} savedMessages={messages} />
        </div>
      </Suspense>
    </div>
  )
}
