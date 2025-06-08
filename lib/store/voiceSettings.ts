import { create } from 'zustand'

export type VoiceEngine = 'playht' | 'otherEngine'
export type OutputMode = 'text-stream' | 'dialog'
export type Voices =
  | 'ellie'
  | 'maddie'
  | 'kenna'
  | 'emma'
  | 'lindsay'
  | 'lovins'
  | 'poki'

interface VoiceSettingsState {
  voiceEngine: VoiceEngine
  outputMode: OutputMode
  voice: Voices
  setVoiceEngine: (engine: VoiceEngine) => void
  setOutputMode: (mode: OutputMode) => void
  setVoice: (voice: Voices) => void
}

export const useVoiceSettings = create<VoiceSettingsState>(set => ({
  voiceEngine: 'playht',
  outputMode: 'text-stream',
  voice: 'ellie',
  setVoiceEngine: voiceEngine => set({ voiceEngine }),
  setOutputMode: outputMode => set({ outputMode }),
  setVoice: voice => set({ voice })
}))
