import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from './index'

export async function createConversation(userId: string, title: string, assistantName?: string) {
  const docRef = await addDoc(collection(db, 'conversations'), {
    userId,
    title,
    assistantName: assistantName || null,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function addMessage(conversationId: string, id: string, role: string, content: string) {
  const messageRef = doc(db, 'conversations', conversationId, 'messages', id)
  await setDoc(messageRef, {
    role,
    content,
    timestamp: serverTimestamp()
  })
}

export async function getConversation(conversationId: string) {
  const docRef = doc(db, 'conversations', conversationId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : null
}

export async function getMessages(conversationId: string) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages')
  const q = query(messagesRef, orderBy('timestamp', 'asc'))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getConversationsForUser(userId: string) {
  const conversationsRef = collection(db, 'conversations')
  const q = query(conversationsRef, orderBy('createdAt', 'desc'))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }) as any)
    .filter(conv => conv.userId === userId)
}

export async function getRecentConversationsForUser(userId: string, n: number = 10) {
  const conversationsRef = collection(db, 'conversations')
  const q = query(conversationsRef, orderBy('createdAt', 'desc'), limit(n))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }) as any)
    .filter(conv => conv.userId === userId)
}

export async function updateMessageWithAudioUrl(conversationId: string, messageId: string, audioUrl: string) {
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId)
  await updateDoc(messageRef, { audioUrl })
}

export async function uploadVoiceResponse(conversationId: string, messageId: string, audioBlob: Blob) {
  const audioRef = ref(storage, `voice_responses/${conversationId}/${messageId}.mp3`)
  await uploadBytes(audioRef, audioBlob, { contentType: 'audio/mpeg' })
  return await getDownloadURL(audioRef)
}

export async function logAllConversations() {
  const conversationsRef = collection(db, 'conversations');
  const querySnapshot = await getDocs(conversationsRef);
  console.log('All conversations:');
  querySnapshot.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}

export async function deleteConversation(conversationId: string) {
  // Delete all messages in the subcollection
  const messagesRef = collection(db, 'conversations', conversationId, 'messages')
  const messagesSnap = await getDocs(messagesRef)
  const batch = writeBatch(db)
  messagesSnap.forEach(doc => batch.delete(doc.ref))
  // Delete the conversation document
  batch.delete(doc(db, 'conversations', conversationId))
  await batch.commit()
} 