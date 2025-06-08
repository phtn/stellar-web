import {
  addMessage as fbAddMessage,
  createConversation as fbCreateConversation,
  getConversation
} from '@/lib/firebase/conversations'
import { db } from '@/lib/firebase/index'
import type { Message } from 'ai/react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Custom hook to manage Firestore conversation logic.
 * Handles conversation creation, loading, and message management.
 */
export function useConversation({
  id,
  savedMessages = []
}: {
  id: string
  savedMessages?: Message[]
}) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const initialLoadRef = useRef(false)

  // Create a new conversation if needed
  const createConversation = useCallback(
    async (userId: string, title: string, assistantName?: string) => {
      const convId = await fbCreateConversation(
        id,
        userId,
        title,
        assistantName
      )
      setConversationId(convId)
      setHasStarted(true)
      return convId
    },
    [id]
  )

  // Add a message to Firestore
  const addMessage = useCallback(
    async (convId: string, msgId: string, role: string, content: string) => {
      await fbAddMessage(convId, msgId, role, content)
    },
    []
  )

  // Ensure conversation doc has all required fields
  useEffect(() => {
    async function ensureConversationFields() {
      if (id && conversationId === id) {
        const convo = await getConversation(id)
        let needsUpdate = false
        const updateData: any = {}
        if (!convo) return // doc doesn't exist, don't update
        if (!convo.title) {
          updateData.title = 'Conversation'
          needsUpdate = true
        }
        if (!convo.assistantName) {
          updateData.assistantName = 'Assistant'
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
          await updateDoc(doc(db, 'conversations', id), updateData)
        }
      }
    }
    ensureConversationFields()
  }, [id, conversationId])

  // Set conversationId on mount if id is present
  useEffect(() => {
    if (id && !conversationId) {
      setConversationId(id)
    }
  }, [id, conversationId])

  return {
    conversationId,
    setConversationId,
    hasStarted,
    setHasStarted,
    createConversation,
    addMessage
  }
}
