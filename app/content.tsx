'use client'

// import { getModels } from '@/lib/config/models'
import { Chat } from '@/components/chat'
import { generateId } from 'ai'

export const Content = () => {
  const id = generateId()

  return <Chat id={id} models={[]} />
}
