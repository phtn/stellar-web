import { xKeys } from '@/ctx/chat/helpers'
import { Message } from 'ai'
import {
  collection,
  doc,
  type DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  type QueryDocumentSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import type { SavedMessage } from '../hooks/use-conversation'
import { db, storage } from './index'
import type {
  AddMessageParams,
  CreateConversationParams,
  IConversation,
  UpdateMessageWithAudioParams,
  UploadVoiceParams
} from './types'

// Add a helper to log Firestore path arguments
function logFirestoreArgs(label: string, ...args: unknown[]): unknown[] {
  console.log(`[Firestore Path] ${label}:`, ...args)
  return args
}

export async function createConversation({
  chatId,
  ...rest
}: CreateConversationParams) {
  // logFirestoreArgs('createConversation', 'conversations', chatId)
  const ref = doc(db, 'conversations', chatId)
  const snaphot = await getDoc(ref)
  !snaphot?.exists() && (await setDoc(ref, convPayload(rest, 'createdAt')))
  return chatId
}

export async function addMessage({ convId, message }: AddMessageParams) {
  // logFirestoreArgs('addMessage', 'conversations', convId, 'messages', id)
  const ref = doc(db, 'conversations', convId, 'messages', message.id)
  console.log('[Firestore] addMessage called with:', { 
    convId, 
    messageId: message.id,
    role: message.role,
    contentLength: message.content?.length,
    hasContent: !!message.content
  })
  await setDoc(ref, createPayload(message, 'timestamp'))
  console.log('[Firestore] addMessage write complete for:', message.id, 'role:', message.role)
}

export async function getConversation(convId: string) {
  // logFirestoreArgs('getConversation', 'conversations', convId)
  const docRef = doc(db, 'conversations', convId)
  const snapshot = await getDoc(docRef)
  return snapshot?.exists() ? snapshot?.data() : null
}

export async function getMessages(convId: string) {
  // console.log('[Firestore] getMessages called with convId:', convId)
  // logFirestoreArgs('getMessages', 'conversations', convId, 'messages')
  const ref = collection(db, 'conversations', convId, 'messages')
  const q = query(ref, orderBy('timestamp', 'asc'))
  const { docs } = await getDocs(q)
  const result = docs.map(xdoc) as SavedMessage[]
  // console.log('[Firestore] getMessages result:', result)
  return result
}

export async function getConversationsForUser(userId: string) {
  // logFirestoreArgs('getConversationsForUser', 'conversations')
  const ref = collection(db, 'conversations')
  const q = query(ref, orderBy('createdAt', 'desc'))
  const { docs } = await getDocs(q)
  return docs.map(xdoc) as IConversation[]
}

export async function getRecentConversationsForUser(userId: string, n = 10) {
  // logFirestoreArgs('getRecentConversationsForUser', 'conversations')
  const ref = collection(db, 'conversations')
  const q = query(
    ref,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(n)
  )
  const { docs } = await getDocs(q)
  return docs.map(xdoc) as IConversation[]
}

export async function updateMessageWithAudioUrl({
  audioUrl,
  convId,
  messageId
}: UpdateMessageWithAudioParams) {
  // logFirestoreArgs('updateMessageWithAudioUrl', 'conversations', convId, 'messages', messageId)
  const ref = doc(db, 'conversations', convId, 'messages', messageId)
  await updateDoc(ref, { audioUrl })
}

export async function uploadVoiceResponse({
  audioBlob,
  convId,
  messageId
}: UploadVoiceParams) {
  // logFirestoreArgs('uploadVoiceResponse', 'voice_responses', convId, `${messageId}.mp3`)
  const audioRef = ref(storage, `voice_responses/${convId}/${messageId}.mp3`)
  await uploadBytes(audioRef, audioBlob, { contentType: 'audio/mpeg' })
  return await getDownloadURL(audioRef)
}

export async function deleteConversation(convId: string) {
  // logFirestoreArgs('deleteConversation', 'conversations', convId, 'messages')
  const ref = collection(db, 'conversations', convId, 'messages')
  const snapshot = await getDocs(ref)
  const batch = writeBatch(db)
  snapshot.forEach(doc => batch.delete(doc.ref))
  // Delete the conversation document
  // logFirestoreArgs('deleteConversation', 'conversations', convId)
  batch.delete(doc(db, 'conversations', convId))
  await batch.commit()
}

export async function logAllConversations() {
  // logFirestoreArgs('logAllConversations', 'conversations')
  const ref = collection(db, 'conversations')
  const { docs } = await getDocs(ref)
  return docs.map(xdoc)
}
const xdoc = <T extends QueryDocumentSnapshot<DocumentData, DocumentData>, R>(
  doc: T
) => ({ id: doc.id, ...doc?.data() }) as R

const convPayload = <T extends Omit<IConversation, 'createdAt'>>(
  fields: T,
  tkey: string
) => {
  return {
    ...fields,
    [tkey]: serverTimestamp()
  }
}
const createPayload = <T extends Message>(fields: T, tkey: string) => {
  const sanitized = xKeys(fields, 'experimental_attachments')
  return {
    ...sanitized,
    [tkey]: serverTimestamp()
  }
}
/*


doc =>
  ({
    id: doc.id,
    ...doc.data()
  }) as SavedMessage

*/
