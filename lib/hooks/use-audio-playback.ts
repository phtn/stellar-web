import { useCallback, useState } from 'react'

/**
 * Custom hook to manage audio state, TTS generation, and playback for chat messages.
 * @param voiceEngine - The selected TTS engine
 * @param outputMode - The TTS output mode
 * @param voice - The selected voice
 * @param audioRef - Ref to the audio element for playback
 * @param uploadVoiceResponse - Function to upload audio to storage
 * @param updateMessageWithAudioUrl - Function to update Firestore message with audio URL
 * @param cleanForTTS - Function to clean message content for TTS
 */
export function useAudioPlayback({
  voiceEngine,
  outputMode,
  voice,
  audioRef,
  uploadVoiceResponse,
  updateMessageWithAudioUrl,
  cleanForTTS
}: {
  voiceEngine: string
  outputMode: string
  voice: string
  audioRef: React.RefObject<HTMLAudioElement>
  uploadVoiceResponse: (convId: string, msgId: string, audioBlob: Blob) => Promise<string>
  updateMessageWithAudioUrl: (convId: string, msgId: string, audioUrl: string) => Promise<void>
  cleanForTTS: (content: string) => string
}) {
  const [audioStates, setAudioStates] = useState<Record<string, any>>({})
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false)

  /**
   * Generate TTS audio for a message, upload it, update Firestore, and handle playback.
   */
  const generateSpeech = useCallback(
    async (msg: any, convId: string): Promise<void> => {
      const msgId = msg.id
      setAudioStates(prev => ({ ...prev, [msgId]: { status: 'receiving' } }))
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
        if (!response.ok) throw new Error('TTS request failed')
        const audioBlob = await response.blob()
        setAudioStates(prev => ({ ...prev, [msgId]: { status: 'uploading' } }))
        if (!convId) {
          setAudioStates(prev => ({
            ...prev,
            [msgId]: { status: 'error', error: 'No conversationId' }
          }))
          return
        }
        // 2. Upload to Firebase Storage
        const storageUrl = await uploadVoiceResponse(convId, msgId, audioBlob)
        setAudioStates(prev => ({
          ...prev,
          [msgId]: { status: 'uploaded', url: storageUrl }
        }))
        // 3. Update Firestore
        await updateMessageWithAudioUrl(convId, msgId, storageUrl)
        setAudioStates(prev => ({
          ...prev,
          [msgId]: { status: 'playable', url: storageUrl }
        }))
        // 4. Optionally, play the audio
        if (audioRef.current) {
          audioRef.current.src = storageUrl
          await audioRef.current.play()
          setAudioStates(prev => ({
            ...prev,
            [msgId]: { ...prev[msgId], status: 'playing' }
          }))
          audioRef.current.addEventListener(
            'ended',
            () => {
              setAudioStates(prev => ({
                ...prev,
                [msgId]: { ...prev[msgId], status: 'playable' }
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
          [msgId]: { status: 'error', error: error.message }
        }))
        setIsTTSPlaying(false)
      } finally {
        setIsGeneratingAudio(false)
      }
    },
    [voiceEngine, outputMode, voice, audioRef, uploadVoiceResponse, updateMessageWithAudioUrl, cleanForTTS]
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