import { getVoice } from '@/app/actions'
import {
  addMessage as fbAddMessage,
  createConversation as fbCreateConversation,
  getConversation,
  getRecentConversationsForUser
} from '@/lib/firebase/conversations'
import { db } from '@/lib/firebase/index'
import { Message } from 'ai'
import {
  doc,
  type FieldValue,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AddMessageParams,
  CreateConversationParams,
  IConversation
} from '../firebase/types'

export type WithId = { id: string }
export interface SavedMessage extends WithId {
  content: string
  audioUrl: string
  timestamp: FieldValue
  role: 'user' | 'assistant'
}

// Debug logging utility
const DEBUG_MODE = process.env.NODE_ENV === 'development'
const logFirestoreArgs = (label: string, ...args: unknown[]): void => {
  if (DEBUG_MODE) {
    console.log(`[Firestore Path] ${label}:`, ...args)
  }
}

/**
 * Custom hook to manage Firestore conversation logic.
 * Handles conversation creation, loading, and message management.
 */
interface UseConversationProps {
  id: string
  userId?: string
}

interface UseConversationReturn {
  convId: string | null
  setConvId: (id: string | null) => void
  addMessage: (params: AddMessageParams) => Promise<void>
  hasStarted: boolean
  conversations: IConversation[]
  setHasStarted: (started: boolean) => void
  initialLoadRef: React.MutableRefObject<boolean>
  createConversation: (params: CreateConversationParams) => Promise<string>
  handleFirstMessage: (message: Message) => Promise<void>
  handleSubsequentMessage: (message: Message) => Promise<void>
  fetchRecentConversations: () => Promise<void>
}

export function useConversation({
  id,
  userId = 'demo-user'
}: UseConversationProps): UseConversationReturn {
  const [convId, setConvId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<IConversation[]>([])
  const [hasStarted, setHasStarted] = useState(false)
  const [justCreated, setJustCreated] = useState(false)

  const initialLoadRef = useRef(false)
  const convIdRef = useRef<string | null>(null)

  // Keep ref in sync with state
  useEffect(() => {
    convIdRef.current = convId
  }, [convId])

  // Create a new conversation if needed
  const createConversation = useCallback(
    async (params: CreateConversationParams): Promise<string> => {
      try {
        const convoId = await fbCreateConversation(params)
        setConvId(convoId)
        setHasStarted(true)
        setJustCreated(true)
        return convoId
      } catch (error) {
        console.error('[createConversation] Error:', error)
        throw error
      }
    },
    []
  )

  // Add a message to Firestore with error handling
  const addMessage = useCallback(
    async (params: AddMessageParams): Promise<void> => {
      try {
        await fbAddMessage(params)
      } catch (error) {
        console.error('[addMessage] Error:', error)
        throw error
      }
    },
    []
  )

  // Default conversation data for missing fields
  const defaultConversationData = useMemo<Partial<IConversation>>(
    () => ({
      title: 'Conversation',
      assistant: 'Assistant',
      createdAt: serverTimestamp(),
      userId
    }),
    [userId]
  )

  // Ensure conversation doc has all required fields
  useEffect(() => {
    async function ensureConversationFields() {
      // Skip if conversation was just created or IDs don't match
      if (!id || convId !== id || justCreated) return

      try {
        const convo = await getConversation(id)
        if (!convo) return // doc doesn't exist

        const updateData: Partial<IConversation> = {}
        let needsUpdate = false

        // Check each required field
        Object.entries(defaultConversationData).forEach(([key, value]) => {
          if (!convo[key as keyof IConversation]) {
            updateData[key as keyof IConversation] = value as any
            needsUpdate = true
          }
        })

        if (needsUpdate) {
          logFirestoreArgs('updateDoc', 'conversations', id)
          await updateDoc(doc(db, 'conversations', id), updateData)
        }
      } catch (error) {
        console.error('[ensureConversationFields] Error:', error)
      }
    }

    ensureConversationFields()
  }, [id, convId, justCreated, defaultConversationData])

  // Update handleFirstMessage to use hook
  const handleFirstMessage = useCallback(
    async (message: Message): Promise<void> => {
      try {
        const assistant = (await getVoice()) ?? 'assistant'

        // if (DEBUG_MODE) {
        //   console.log('[handleFirstMessage] Creating conversation for:', {
        //     messageId: message.id,
        //     role: message.role,
        //     contentPreview: message.content.slice(0, 50)
        //   })
        // }

        const newConvId = await createConversation({
          userId,
          assistant,
          chatId: id,
          title: message.content.slice(0, 32) || 'Conversation'
        })

        await addMessage({ convId: newConvId, message })
      } catch (error) {
        console.error('[handleFirstMessage] Error:', error)
        throw error
      }
    },
    [id, userId, addMessage, createConversation]
  )

  const handleSubsequentMessage = useCallback(
    async (message: Message): Promise<void> => {
      const currentConvId = convIdRef.current
      if (!currentConvId) {
        console.warn('[handleSubsequentMessage] No conversation ID available')
        return
      }

      // if (DEBUG_MODE) {
      //   console.log('[handleSubsequentMessage] Adding message:', {
      //     convId: currentConvId,
      //     messageId: message.id,
      //     role: message.role
      //   })
      // }

      await addMessage({ convId: currentConvId, message })
    },
    [addMessage]
  )

  // Fetch recent conversations for context
  const fetchRecentConversations = useCallback(async (): Promise<void> => {
    try {
      const recents = await getRecentConversationsForUser(userId, 10)
      setConversations(recents)
    } catch (error) {
      console.error('[fetchRecentConversations] Error:', error)
    }
  }, [userId])

  // Set conversationId on mount if id is present
  useEffect(() => {
    if (id && !convId) {
      setConvId(id)
    }
  }, [id, convId])

  return {
    convId,
    setConvId,
    addMessage,
    hasStarted,
    conversations,
    setHasStarted,
    initialLoadRef,
    createConversation,
    handleFirstMessage,
    handleSubsequentMessage,
    fetchRecentConversations
  }
}
