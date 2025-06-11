import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import {
  UpdateMessageWithAudioParams,
  UploadVoiceParams
} from '../firebase/types'

interface AudioState {
  status: 'idle' | 'receiving' | 'uploading' | 'uploaded' | 'playable' | 'playing' | 'error'
  url?: string
  error?: string
}

interface ChatMessage {
  id: string
  content: string
  [key: string]: any
}

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
  const [audioStates, setAudioStates] = useState<Record<string, AudioState>>({})
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false)
  const audioEndHandlerRef = useRef<(() => void) | null>(null)

  // Clean up audio event listeners
  useEffect(() => {
    const audioElement = audioRef.current
    return () => {
      if (audioEndHandlerRef.current && audioElement) {
        audioElement.removeEventListener('ended', audioEndHandlerRef.current)
      }
    }
  }, [audioRef])

  // Helper to update audio state
  const updateAudioState = useCallback((messageId: string, state: Partial<AudioState>) => {
    setAudioStates((prev: Record<string, AudioState>) => ({
      ...prev,
      [messageId]: { ...prev[messageId], ...state }
    }))
  }, [])

  /**
   * Generate TTS audio for a message, upload it, update Firestore, and handle playback.
   */
  const generateSpeech = useCallback(
    async (msg: ChatMessage, convId: string): Promise<void> => {
      const messageId = msg.id
      
      // Early return if not enabled
      if (!enabled) return
      
      setIsGeneratingAudio(true)
      updateAudioState(messageId, { status: 'receiving' })

      try {
        // 1. Get TTS audio
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
        
        if (!response.ok) {
          throw new Error(`TTS request failed: ${response.status} ${response.statusText}`)
        }
        
        const audioBlob = await response.blob()
        updateAudioState(messageId, { status: 'uploading' })
        
        if (!convId) {
          throw new Error('No conversationId provided')
        }
        
        // 2. Upload to Firebase Storage
        const audioUrl = await uploadVoiceResponse({
          convId,
          messageId,
          audioBlob
        })
        updateAudioState(messageId, { status: 'uploaded', url: audioUrl })
        
        // 3. Update Firestore
        await updateMessageWithAudioUrl({ convId, messageId, audioUrl })
        updateAudioState(messageId, { status: 'playable', url: audioUrl })
        
        // 4. Play the audio if audio element is available
        if (audioRef.current && audioUrl) {
          // Remove previous event listener if exists
          if (audioEndHandlerRef.current) {
            audioRef.current.removeEventListener('ended', audioEndHandlerRef.current)
          }
          
          // Create new event handler
          audioEndHandlerRef.current = () => {
            updateAudioState(messageId, { status: 'playable' })
            setIsTTSPlaying(false)
          }
          
          audioRef.current.src = audioUrl
          await audioRef.current.play()
          updateAudioState(messageId, { status: 'playing' })
          setIsTTSPlaying(true)
          
          audioRef.current.addEventListener('ended', audioEndHandlerRef.current, { once: true })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        updateAudioState(messageId, { status: 'error', error: errorMessage })
        setIsTTSPlaying(false)
        console.error('TTS generation error:', error)
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
      updateMessageWithAudioUrl,
      updateAudioState
    ]
  )

  // Stop audio playback
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsTTSPlaying(false)
    }
  }, [audioRef])

  // Get audio state for a specific message
  const getAudioState = useCallback((messageId: string): AudioState => {
    return audioStates[messageId] || { status: 'idle' }
  }, [audioStates])

  return {
    audioStates,
    setAudioStates,
    generateSpeech,
    isTTSPlaying,
    setIsTTSPlaying,
    isGeneratingAudio,
    setIsGeneratingAudio,
    stopAudio,
    getAudioState
  }
}
