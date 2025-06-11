'use client'

import { addMessage, getMessages } from '@/lib/firebase/conversations'
import { AddMessageParams } from '@/lib/firebase/types'
import { useToggle } from '@/lib/hooks/use-toggle'
import { convertToUIMessages } from '@/lib/utils'
import { ChatRequestOptions, CreateMessage, Message } from 'ai'
import {
  createContext,
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import {
  asyncFn,
  createSections,
  excludeAudioUrl,
  getLastUserIndex
} from './helpers'
import { ChatSection } from './types'

export type SetMessage = (
  messages: Message[] | ((messages: Message[]) => Message[])
) => void
type AppendMessage = (
  msg: Message | CreateMessage,
  options?: ChatRequestOptions
) => Promise<string | null | undefined>

interface MessageCtxValues {
  on: boolean
  isLoading: boolean
  selectQuery: (query: string, append: any) => unknown
  initialLoadRef: MutableRefObject<boolean>
  loadMessages: (convId: string) => void
  allMessages: Message[]
  lastUserIndex: number
  getIsOpen: (id: string) => boolean
  sections: ChatSection[]
  handleOpenChange: (id: string, open: boolean) => void
  toggle: VoidFunction
}
export const MessageCtx = createContext<MessageCtxValues | null>(null)

interface MessageCtxProps {
  children: ReactNode
  messages: Message[]
}
export const MessageCtxProvider = ({ children, messages }: MessageCtxProps) => {
  const [isLoading, setLoading] = useState(false)
  const [allMessages, setAllMessages] = useState<Message[]>([])
  const [sections, setSections] = useState<ChatSection[]>([])
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})

  const { on, toggle } = useToggle(false)

  const initialLoadRef = useRef(false)

  const openManualTool = useCallback(
    (toolCallId = 'manual-tool-call') => {
      // Open manual tool call when the last section is a user message
      const lastSection = sections[sections.length - 1]
      if (lastSection.userMessage.role === 'user') {
        setOpenStates({ [toolCallId]: true })
      }
    },
    [sections]
  )

  useEffect(() => {
    if (sections.length > 0) {
      openManualTool()
    }
  }, [sections, openManualTool])

  const storeMessage = useCallback(
    (params: AddMessageParams) => asyncFn(addMessage, params),
    []
  )

  const loadMessages = useCallback(async (convId: string) => {
    const msgs = await getMessages(convId)
    // console.log('[MessageCtx] getMessages result:', msgs)
    const x = excludeAudioUrl(msgs) as Message[]
    setAllMessages(x)
    // console.log('[MessageCtx] after excludeKeys + convertToUIMessages:', uiMsgs)
    initialLoadRef.current = true
  }, [])

  const lastUserIndex = useMemo(() => getLastUserIndex(messages), [messages])
  useEffect(() => {
    if (messages) {
      const s = createSections(messages)
      setSections(s)
      console.log('[MessageCtx] sections:', s)
      // console.log('[MessageCtx] allMessages:', allMessages)
    }
  }, [messages])

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    setOpenStates(prev => ({
      ...prev,
      [id]: open
    }))
  }, [])

  const onOpenChange = useCallback((check: boolean) => {}, [])

  const getIsOpen = useCallback(
    (id: string) => {
      if (id.includes('call')) {
        return openStates[id] ?? true
      }
      const baseId = id.endsWith('-related') ? id.slice(0, -8) : id
      const index = messages.findIndex(msg => msg.id === baseId)
      return openStates[id] ?? index >= lastUserIndex
    },
    [messages, lastUserIndex, openStates]
  )

  const selectQuery = useCallback(
    async (query: string, append: AppendMessage) => {
      await append({
        role: 'user',
        content: query
      })
    },
    []
  )

  const value = useMemo(
    () => ({
      on,
      toggle,
      sections,
      isLoading,
      getIsOpen,
      allMessages,
      selectQuery,
      storeMessage,
      loadMessages,
      lastUserIndex,
      initialLoadRef,
      handleOpenChange
    }),
    [
      on,
      toggle,
      sections,
      isLoading,
      getIsOpen,
      allMessages,
      selectQuery,
      storeMessage,
      loadMessages,
      lastUserIndex,
      initialLoadRef,
      handleOpenChange
    ]
  )

  return <MessageCtx.Provider value={value}>{children}</MessageCtx.Provider>
}

// // Convert messages array to sections array
// const createSections = (messages: Message[]) => {
//   const result: ChatSection[] = []
//   let currentSection: ChatSection | null = null

//   for (const message of messages) {
//     if (message.role === 'user') {
//       // Start a new section when a user message is found
//       if (currentSection) {
//         result.push(currentSection)
//       }
//       currentSection = {
//         id: message.id,
//         userMessage: message,
//         assistantMessages: []
//       }
//     } else if (currentSection && message.role === 'assistant') {
//       // Add assistant message to the current section
//       currentSection.assistantMessages.push(message)
//     }
//     // Ignore other role types like 'system' for now
//   }

//   // Add the last section if exists
//   if (currentSection) {
//     result.push(currentSection)
//   }

//   return result
// }
