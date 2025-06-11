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

interface IChatOptions {
  id: string
  messages: Message[] | undefined
  setAssistantAction: Dispatch<SetStateAction<Message | null>>
}
export const useChatOptions = ({
  id,
  messages,
  setAssistantAction
}: IChatOptions) => {
  const [body, setBody] = useState<object>()

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
    onError,
    experimental_throttle: 100
    // sendExtraMessageFields: false,
  } as UseChatOptions
}

function isActionOrGesture(content: string) {
  const trimmed = content.trim()
  // Matches *action*, /action/, (action), possibly with whitespace
  return (
    /^\*.*\*$/.test(trimmed) ||
    /^\/.*\/$/.test(trimmed) ||
    /^\(.*\)$/.test(trimmed)
  )
}
