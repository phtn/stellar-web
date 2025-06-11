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
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AddMessageParams,
  CreateConversationParams,
  IConversation
} from '../firebase/types'
import { excludeKeys } from '@/ctx/chat/helpers'

export type WithId = { id: string }
export interface SavedMessage extends WithId {
  content: string
  audioUrl: string
  timestamp: FieldValue
  role: 'user' | 'assistant'
}

/**
 * Custom hook to manage Firestore conversation logic.
 * Handles conversation creation, loading, and message management.
 */
interface UseConversation {
  id: string
  savedMessages?: SavedMessage[]
}
export function useConversation({ id }: UseConversation) {
  const [convId, setConvId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<IConversation[]>([])
  const [hasStarted, setHasStarted] = useState(false)

  const initialLoadRef = useRef(false)

  // Create a new conversation if needed
  const createConversation = useCallback(
    async (params: CreateConversationParams) => {
      const convo = await fbCreateConversation(params)
      setConvId(convo)
      setHasStarted(true)
      return convo
    },
    []
  )

  // Add a message to Firestore
  const addMessage = useCallback(
    async (params: AddMessageParams) => await fbAddMessage(params),
    []
  )

  // Add a helper to log Firestore path arguments
  function logFirestoreArgs(label: string, ...args: unknown[]): unknown[] {
    console.log(`[Firestore Path] ${label}:`, ...args)
    return args
  }

  // Ensure conversation doc has all required fields
  useEffect(() => {
    async function ensureConversationFields() {
      if (id && convId === id) {
        // logFirestoreArgs('ensureConversationFields', 'conversations', id)
        const convo = await getConversation(id)
        let needsUpdate = false
        const updateData = {} as IConversation
        if (!convo) return // doc doesn't exist, don't update
        if (!convo.title) {
          updateData.title = 'Conversation'
          needsUpdate = true
        }
        if (!convo.assistant) {
          updateData.assistant = 'Assistant'
          needsUpdate = true
        }
        if (!convo.createdAt) {
          updateData.createdAt = serverTimestamp()
          needsUpdate = true
        }
        if (!convo.userId) {
          updateData.userId = 'demo-user'
          needsUpdate = true
        }
        if (needsUpdate) {
          logFirestoreArgs('updateDoc', 'conversations', id)
          await updateDoc(doc(db, 'conversations', id), { ...updateData })
        }
      }
    }
    ensureConversationFields()
  }, [id, convId])

  // Update handleFirstMessage to use hook
  const handleFirstMessage = useCallback(
    async (message: Message) => {
      // Always call createConversation for the first user message
      const userId = 'demo-user'
      const assistant = (await getVoice()) ?? 'assistant'
      const params = {
        convId,
        message
      } as AddMessageParams

      console.log('FIRST', excludeKeys(message, 'experimental_attachments'))

      try {
        const convId = await createConversation({
          userId,
          assistant,
          chatId: id,
          title: message.content.slice(0, 32) ?? 'Conversation'
        })
        setConvId(convId)
        await addMessage({ ...params, convId })
        setHasStarted(true)
      } catch (err) {
        console.error('[handleFirstMessage] createConversation error', err)
      }
    },
    [id, addMessage, createConversation, setConvId, setHasStarted, convId]
  )

  const handleSubsequentMessage = useCallback(
    async (message: Message) => {
      const params = {
        convId,
        message
      } as AddMessageParams
      convId && (await addMessage({ ...params, convId }))
    },
    [addMessage, convId]
  )

  // Only load Firestore messages on initial conversation load and if chat is empty

  // Fetch 10 recent conversations for context
  const fetchRecentConversations = useCallback(async () => {
    // TODO: Replace with actual user id from auth
    const userId = 'demo-user'
    const recents = await getRecentConversationsForUser(userId, 10)
    // Use recentConvos as needed for context
    setConversations(recents)
  }, [])

  // Optionally, fetch recent conversations on mount or when needed
  useEffect(() => {
    fetchRecentConversations()
  }, [fetchRecentConversations])

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
    handleSubsequentMessage
  }
}
