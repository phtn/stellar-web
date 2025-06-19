import type { Message } from 'ai'
import type { FieldValue } from 'firebase/firestore'

export interface CreateConversationParams {
  title: string
  chatId: string
  userId: string
  assistant: string | null
}

export interface IConversation {
  id?: string
  title: string
  userId: string
  assistant: string | null
  createdAt: FieldValue
}

export interface AddMessageParams {
  convId: string
  message: Message
}

export interface UpdateMessageWithAudioParams {
  convId: string
  messageId: string
  audioUrl: string
}

export interface UploadVoiceParams {
  convId: string
  messageId: string
  audioBlob: Blob
}
