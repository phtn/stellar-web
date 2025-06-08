import { useMemo } from 'react'
import { format } from 'date-fns'
import { DocumentData } from 'firebase/firestore'

export interface IConversation {
  assistantName: string
  userId: string
  createdAt: string
  title?: string
}
interface StoredMessages {
  id: string
  role: 'assistant' | 'user' | 'system'
  content: string
  audioUrl: string | null
}
interface ConversationContentProps {
  conversation: DocumentData
}
export const Conversation = ({ conversation }: ConversationContentProps) => {
  const formattedDate = useMemo(() => {
    const millis =
      conversation.createdAt.seconds * 1000 +
      Math.floor(conversation.createdAt.nanoseconds / 1e6)
    const date = new Date(millis)
    return format(date, 'Pp')
  }, [conversation.createdAt])
  return (
    <div className="mb-6 mx-10 pb-4">
      <h1 className="text-2xl font-bold mb-1 truncate">
        {conversation.title ?? 'Conversation'}
      </h1>
      <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
        {conversation.assistantName && (
          <span>Assistant: {conversation.assistantName}</span>
        )}
        {conversation.createdAt && <span>Created: {formattedDate}</span>}
      </div>
    </div>
  )
}
