'use client'

import { addMessage, getMessages } from '@/lib/firebase/conversations'
import { AddMessageParams } from '@/lib/firebase/types'
import { useToggle } from '@/lib/hooks/use-toggle'
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
      if (lastSection?.userMessage.role === 'user') {
        setOpenStates(prev => ({ ...prev, [toolCallId]: true }))
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
    const x = excludeAudioUrl(msgs) as Message[]
    setAllMessages(x)
    initialLoadRef.current = true
  }, [])

  const lastUserIndex = useMemo(() => getLastUserIndex(messages), [messages])



  // Optimize sections creation with proper dependency tracking
  useEffect(() => {
    if (messages && messages.length > 0) {
      const newSections = createSections(messages)
      setSections(prevSections => {
        // Only update if sections actually changed
        if (prevSections.length !== newSections.length) {
          console.log('[MessageCtx] sections:', newSections)
          return newSections
        }

        // Check if any section content changed
        const hasChanged = newSections.some((newSection, index) => {
          const oldSection = prevSections[index]
          return !oldSection ||
            oldSection.id !== newSection.id ||
            oldSection.userMessage.id !== newSection.userMessage.id ||
            oldSection.assistantMessages.length !== newSection.assistantMessages.length
        })

        if (hasChanged) {
          console.log('[MessageCtx] sections:', newSections)
          return newSections
        }

        return prevSections
      })

  // Create a map of message IDs to their indices for efficient lookup
  const messageIdToIndex = useMemo(() => {
    const map = new Map<string, number>()
    messages.forEach((msg, index) => {
      map.set(msg.id, index)
    })
    return map
  }, [messages])


  // Memoize sections to prevent unnecessary recalculations
  const memoizedSections = useMemo(() => {
    if (messages) {
      return createSections(messages)

    }
    return []
  }, [messages])

  useEffect(() => {
    if (JSON.stringify(sections) !== JSON.stringify(memoizedSections)) {
      setSections(memoizedSections)
      console.log('[MessageCtx] sections:', memoizedSections)
    }
  }, [memoizedSections, sections])

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    setOpenStates((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: open
    }))
  }, [])

  const onOpenChange = useCallback((check: boolean) => { }, [])

  const getIsOpen = useCallback(
    (id: string) => {
      // Check explicit open state first
      if (openStates[id] !== undefined) {
        return openStates[id]
      }

      // For tool calls, check if they have an explicit state
      if (id.includes('call')) {
        return openStates[id] ?? true
      }

      // Handle related questions or other special IDs
      const baseId = id.endsWith('-related') ? id.slice(0, -8) : id

      // Check if we have an explicit state for the base ID
      if (openStates[baseId] !== undefined) {
        return openStates[baseId]
      }

      // Use message position to determine default open state
      const messageIndex = messageIdToIndex.get(baseId)
      if (messageIndex !== undefined && lastUserIndex !== -1) {
        // Messages at or after the last user message should be open by default
        return messageIndex >= lastUserIndex
      }

      // Default to true if we can't determine the position
      return true
    },
    [openStates, messageIdToIndex, lastUserIndex]
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
