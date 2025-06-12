import type { SavedMessage } from '@/lib/hooks/use-conversation'
import { Icon } from '@/lib/icons'
import { Suspense } from 'react'
import { Conversation } from './content'
import { ChatMessages } from './messages'

type Params = Promise<{ id: string }>

export default async function ChatPage(props: { params: Params }) {
  const { id } = await props.params

  return (
    <div className="max-w-2x mx-auto py-8 px-4 h-full min-h-0 flex flex-col">
      <Conversation />
      <Suspense
        fallback={
          <Icon name="spinners-ring" className="size-4 text-sidebar-accent" />
        }
      >
        <ChatMessages id={id} />
      </Suspense>
    </div>
  )
}

const parseMsg = (msg: SavedMessage) => ({
  id: msg.id,
  role: msg.role,
  content: msg.content,
  audioUrl: msg.audioUrl ?? null,
  timestamp: msg.timestamp
  // add other fields if needed
})
