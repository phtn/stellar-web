import { RefObject, useCallback, useState } from 'react'
import {
  UpdateMessageWithAudioParams,
  UploadVoiceParams
} from '../firebase/types'

/**
 * Custom hook to manage audio state, TTS generation, and playback for chat messages.
 * @param voice - The selected voice
 * @param enabled - Voice enabled status
 * @param audioRef - Ref to the audio element for playback
 * @param outputMode - The TTS output mode
 * @param voiceEngine - The selected TTS engine
 * @param cleanForTTS - Function to clean message content for TTS
 * @param uploadVoiceResponse - Function to upload audio to storage
 * @param updateMessageWithAudioUrl - Function to update Firestore message with audio URL
 */

interface IUseAudioPlayback {
  voice: string
  enabled: boolean
  audioRef: RefObject<HTMLAudioElement>
  outputMode: string
  voiceEngine: string
  cleanForTTS: (content: string) => string
  uploadVoiceResponse: (params: UploadVoiceParams) => Promise<string>
  updateMessageWithAudioUrl: (
    params: UpdateMessageWithAudioParams
  ) => Promise<void>
}

export function useAudioPlayback({
  voice,
  audioRef,
  outputMode,
  voiceEngine,
  cleanForTTS,
  enabled = false,
  uploadVoiceResponse,
  updateMessageWithAudioUrl
}: IUseAudioPlayback) {
  const [audioStates, setAudioStates] = useState<Record<string, any>>({})
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false)

  /**
   * Generate TTS audio for a message, upload it, update Firestore, and handle playback.
   */
  const generateSpeech = useCallback(
    async (msg: any, convId: string): Promise<void> => {
      const messageId = msg.id
      setAudioStates(prev => ({
        ...prev,
        [messageId]: { status: 'receiving' }
      }))
      try {
        // 1. Check if Voice is enabled
        if (!enabled) return
        // 2. Get TTS audio
        const response = await fetch('/api/tts/playht', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: cleanForTTS(msg.content),
            voiceEngine,
            outputMode,
            voice
          })
        })
        if (!response.ok) throw new Error('TTS request failed')
        const audioBlob = await response.blob()
        setAudioStates(prev => ({
          ...prev,
          [messageId]: { status: 'uploading' }
        }))
        if (!convId) {
          setAudioStates(prev => ({
            ...prev,
            [messageId]: { status: 'error', error: 'No conversationId' }
          }))
          return
        }
        // 2. Upload to Firebase Storage
        const audioUrl = await uploadVoiceResponse({
          convId,
          messageId,
          audioBlob
        })
        setAudioStates(prev => ({
          ...prev,
          [messageId]: { status: 'uploaded', url: audioUrl }
        }))
        // 3. Update Firestore
        await updateMessageWithAudioUrl({ convId, messageId, audioUrl })
        setAudioStates(prev => ({
          ...prev,
          [messageId]: { status: 'playable', url: audioUrl }
        }))
        // 4. Optionally, play the audio
        if (audioRef.current) {
          audioRef.current.src = audioUrl
          await audioRef.current.play()
          setAudioStates(prev => ({
            ...prev,
            [messageId]: { ...prev[messageId], status: 'playing' }
          }))
          audioRef.current.addEventListener(
            'ended',
            () => {
              setAudioStates(prev => ({
                ...prev,
                [messageId]: { ...prev[messageId], status: 'playable' }
              }))
              setIsTTSPlaying(false)
            },
            { once: true }
          )
        } else {
          setIsTTSPlaying(false)
        }
      } catch (error: any) {
        setAudioStates(prev => ({
          ...prev,
          [messageId]: { status: 'error', error: error.message }
        }))
        setIsTTSPlaying(false)
      } finally {
        setIsGeneratingAudio(false)
      }
    },
    [
      voice,
      enabled,
      audioRef,
      outputMode,
      voiceEngine,
      cleanForTTS,
      uploadVoiceResponse,
      updateMessageWithAudioUrl
    ]
  )

  return {
    audioStates,
    setAudioStates,
    generateSpeech,
    isTTSPlaying,
    setIsTTSPlaying,
    isGeneratingAudio,
    setIsGeneratingAudio
  }
}
