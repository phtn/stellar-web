'use client'

import { Chat } from '@/components/chat'
import { generateId } from 'ai'
import { Model } from '@/lib/types/models'

interface ContentProps {
  models: Model[]
}
export const Content = ({ models }: ContentProps) => {
  const id = generateId()
  return <Chat id={id} models={models} />
}
