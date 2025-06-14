'use server'

import { Voices } from '@/lib/store/voiceSettings'
import { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const opts: CookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: true,
  secure: true
}

export const setWSState = async (state: 'enabled' | 'disabled') => {
  const store = await cookies()
  store.set('ws-state', state, { ...opts })
}

export const getWSState = async () => {
  const store = await cookies()
  return store.get('ws-state')?.value
}

export const setVoice = async (voice: Voices) => {
  const store = await cookies()
  store.set('cr-vc', voice, { ...opts })
  return voice
}

export const getVoice = async () => {
  const store = await cookies()
  return store.get('cr-vc')?.value as Voices
}
type VoiceEnabledState = 'enabled' | 'disabled'
export const setVoiceState = async (state: VoiceEnabledState) => {
  const store = await cookies()
  store.set('vc-st', state, { ...opts })
  return state
}

export const getVoiceState = async () => {
  const store = await cookies()
  return store.get('vc-st')?.value as VoiceEnabledState
}
