import { create } from 'zustand'

export type VoiceEngine = 'playht' | 'otherEngine'
export type OutputMode = 'text-stream' | 'dialog'

interface VoiceSettingsState {
  voiceEngine: VoiceEngine
  outputMode: OutputMode
  setVoiceEngine: (engine: VoiceEngine) => void
  setOutputMode: (mode: OutputMode) => void
}

export const useVoiceSettings = create<VoiceSettingsState>(set => ({
  voiceEngine: 'playht',
  outputMode: 'text-stream',
  setVoiceEngine: (voiceEngine) => set({ voiceEngine }),
  setOutputMode: (outputMode) => set({ outputMode })
})) 