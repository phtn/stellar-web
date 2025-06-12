'use client'

import { Chat } from '@/components/chat'
import { VoiceInitializer } from '@/components/ui/voice-init'
import { Model } from '@/lib/types/models'
import { generateId } from 'ai'

export const Content = ({ models }: { models: Model[] }) => {
  const id = generateId()
  return (
    <>
      <VoiceInitializer />
      <Chat id={id} models={models} />
    </>
  )
}
