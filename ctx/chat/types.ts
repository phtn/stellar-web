import type { Message } from 'ai'

// Define section structure
export interface ChatSection {
  id: string // User message ID
  userMessage: Message
  assistantMessages: Message[]
}
