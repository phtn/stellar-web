import { SpeechToTextService } from '@/services/stt'
import { useCallback, useRef, useState } from 'react'

type RecordingMethod = 'browser' | 'manual'

/**
 * Custom hook to manage browser/manual voice recording and STT logic.
 * @param setInput - Function to update the chat input
 */
export function useVoiceRecorder({
  setInput
}: {
  setInput: (fn: (prev: string) => string) => void
}) {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false)
  const [recordingMethod] = useState<RecordingMethod>('browser')
  const sttServiceRef = useRef<SpeechToTextService | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Browser Speech Recognition
  const startBrowserRecording = useCallback(() => {
    if (sttServiceRef.current && !isRecording) {
      setIsRecording(true)
      sttServiceRef.current.start()
    }
  }, [isRecording])

  const stopBrowserRecording = useCallback(() => {
    if (sttServiceRef.current && isRecording) {
      sttServiceRef.current.stop()
    }
  }, [isRecording])

  const processAudioFile = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessingAudio(true)
      try {
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.wav')
        const response = await fetch('/api/stt', {
          method: 'POST',
          body: formData
        })
        const result = await response.json()
        if (result.success && result.text) {
          setInput(prev => prev + result.text)
        } else {
          console.error('STT failed:', result.error)
        }
      } catch (error) {
        console.error('Error processing audio:', error)
      } finally {
        setIsProcessingAudio(false)
      }
    },
    [setInput]
  )

  // Manual recording
  const startManualRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      mediaRecorder.addEventListener('dataavailable', event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      })
      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/wav'
        })
        await processAudioFile(audioBlob)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      })
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }, [processAudioFile])

  const stopManualRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  // Process audio file (STT)
  // Toggle recording
  const handleRecordingToggle = useCallback(() => {
    const isBrowserSpeechSupported =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    if (recordingMethod === 'browser' && isBrowserSpeechSupported) {
      if (isRecording) {
        stopBrowserRecording()
      } else {
        startBrowserRecording()
      }
    } else {
      if (isRecording) {
        stopManualRecording()
      } else {
        startManualRecording()
      }
    }
  }, [
    isRecording,
    recordingMethod,
    startBrowserRecording,
    stopBrowserRecording,
    startManualRecording,
    stopManualRecording
  ])

  // Initialize browser STT service
  const initializeSTT = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    ) {
      sttServiceRef.current = new SpeechToTextService({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        maxDurationMs: 10000,
        onResult: (finalTranscript, interimTranscript) => {
          if (finalTranscript) {
            setInput(prev => prev + finalTranscript + '. ')
            setIsRecording(false)
          } else {
            console.log(interimTranscript)
          }
        },
        onError: error => {
          console.log('Speech recognition error:', error)
          setIsRecording(false)
        },
        onEnd: () => {
          setIsRecording(false)
        }
      })
    }
  }, [setInput])

  return {
    isRecording,
    isProcessingAudio,
    startRecording:
      recordingMethod === 'browser'
        ? startBrowserRecording
        : startManualRecording,
    stopRecording:
      recordingMethod === 'browser'
        ? stopBrowserRecording
        : stopManualRecording,
    handleRecordingToggle,
    initializeSTT
  }
}
