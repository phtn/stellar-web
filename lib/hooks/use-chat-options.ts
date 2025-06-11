'use client'

import { Message, UseChatOptions } from 'ai/react'
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import { toast } from 'sonner'

// Helper function to check if content is an action or gesture
const isActionOrGesture = (content: string): boolean => {
  const trimmed = content.trim()
  // Matches *action*, /action/, (action), possibly with whitespace
  return (
    /^\*.*\*$/.test(trimmed) ||
    /^\/.*\/$/.test(trimmed) ||
    /^\(.*\)$/.test(trimmed)
  )
}

interface IChatOptions {
  id: string
  messages: Message[] | undefined
  setAssistantAction: Dispatch<SetStateAction<Message | null>>
}

export const useChatOptions = ({
  id,
  messages,
  setAssistantAction
}: IChatOptions): UseChatOptions => {
  const [body, setBody] = useState<Record<string, string>>({})

  useEffect(() => {
    if (id) {
      setBody({ id })
    }
  }, [id])

  const initialMessages = useMemo(() => messages ?? [], [messages])

  const onFinish = useCallback(
    async (msg: Message) => {
      if (
        msg.role === 'assistant' &&
        msg.content.trim() &&
        !isActionOrGesture(msg.content)
      ) {
        setAssistantAction(msg)
      }
    },
    [setAssistantAction]
  )

  const onError = useCallback((error: Error) => {
    toast.error(`Error in chat: ${error.message}`)
  }, [])

  return {
    id,
    body,
    initialMessages,
    onFinish,
    onError
  }
}
