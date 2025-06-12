'use client'

import { getVoice, getVoiceState, setVoice, setVoiceState } from '@/app/actions'
import { Voices } from '@/lib/store/voiceSettings'
import {
  createContext,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'

interface VoiceCtxValues {
  voiceState: boolean
  voiceModel: Voices
  playback: VoidFunction
  onAudioPlay: VoidFunction
  onAudioPause: VoidFunction
  onAudioEnded: VoidFunction
  toggleVoiceState: VoidFunction
  selectVoiceModel: (voice: Voices) => void
  audioRef: RefObject<HTMLAudioElement>
}

export const VoiceCtx = createContext<VoiceCtxValues | null>(null)

export const VoiceCtxProvider = ({ children }: { children: ReactNode }) => {
  const [voiceState, set] = useState(false)
  const [voiceModel, setVoiceModel] = useState<Voices>('ellie')

  const setState = useCallback((state: 'enabled' | 'disabled') => {
    set(state === 'enabled')
  }, [])

  const toggleVoiceState = useCallback(async () => {
    const state = await setVoiceState(voiceState ? 'disabled' : 'enabled')
    set(state === 'enabled')
  }, [voiceState])

  const selectVoiceModel = useCallback(async (voice: Voices) => {
    const activeVoice = await setVoice(voice)
    setVoiceModel(activeVoice)
  }, [])

  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const playback = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }, [isPlaying])

  const onAudioEnded = useCallback(() => setIsPlaying(false), [])
  const onAudioPlay = useCallback(() => setIsPlaying(false), [])
  const onAudioPause = useCallback(() => setIsPlaying(false), [])

  useEffect(() => {
    getVoiceState().then(setState).catch(console.error)
    getVoice().then(setVoiceModel).catch(console.error)
  }, [setState])

  const value = useMemo(
    () => ({
      voiceState,
      toggleVoiceState,
      voiceModel,
      selectVoiceModel,
      playback,
      onAudioPlay,
      onAudioEnded,
      onAudioPause,
      audioRef
    }),
    [
      voiceState,
      toggleVoiceState,
      voiceModel,
      selectVoiceModel,
      playback,
      onAudioPlay,
      onAudioEnded,
      onAudioPause,
      audioRef
    ]
  )
  return <VoiceCtx.Provider value={value}>{children}</VoiceCtx.Provider>
}

export const useVoiceCtx = () => {
  const ctx = useContext(VoiceCtx)
  if (ctx === null) {
    throw new Error('VoiceCtx not a parent')
  }
  return ctx
}
