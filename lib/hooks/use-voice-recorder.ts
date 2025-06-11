'use client'

import { SpeechToTextService } from '@/services/stt'
import { useCallback, useEffect, useRef, useState } from 'react'

type RecordingMethod = 'browser' | 'manual'

interface UseVoiceRecorderOptions {
  setInputAction: (fn: (prev: string) => string) => void
  recordingMethod?: RecordingMethod
  lang?: string
}

/**
 * Custom hook to manage browser/manual voice recording and STT logic.
 */
export function useVoiceRecorder({
  setInputAction,
  recordingMethod = 'browser',
  lang = 'en-US'
}: UseVoiceRecorderOptions) {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false)
  const sttServiceRef = useRef<SpeechToTextService | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Check if browser speech recognition is supported
  const isBrowserSpeechSupported = useCallback(() => {
    return typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
  }, [])

  // Cleanup function for media resources
  const cleanupMediaResources = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      streamRef.current = null
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null
    }
    audioChunksRef.current = []
  }, [])

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
      setIsRecording(false)
    }
  }, [isRecording])

  // Process audio file with error handling
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
        
        if (!response.ok) {
          throw new Error(`STT API error: ${response.status}`)
        }
        
        const result = await response.json()
        if (result.success && result.text) {
          setInputAction(prev => prev + result.text)
        } else {
          console.error('STT failed:', result.error)
        }
      } catch (error) {
        console.error('Error processing audio:', error)
      } finally {
        setIsProcessingAudio(false)
      }
    },
    [setInputAction]
  )

  // Manual recording with improved error handling
  const startManualRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      // Event handlers
      const handleDataAvailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      const handleStop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/wav'
        })
        await processAudioFile(audioBlob)
        cleanupMediaResources()
      }
      
      mediaRecorder.addEventListener('dataavailable', handleDataAvailable)
      mediaRecorder.addEventListener('stop', handleStop)
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      cleanupMediaResources()
    }
  }, [processAudioFile, cleanupMediaResources])

  const stopManualRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  // Toggle recording
  const handleRecordingToggle = useCallback(() => {
    const useBrowserRecording = recordingMethod === 'browser' && isBrowserSpeechSupported()
    
    if (isRecording) {
      if (useBrowserRecording) {
        stopBrowserRecording()
      } else {
        stopManualRecording()
      }
    } else {
      if (useBrowserRecording) {
        startBrowserRecording()
      } else {
        startManualRecording()
      }
    }
  }, [
    isRecording,
    recordingMethod,
    isBrowserSpeechSupported,
    startBrowserRecording,
    stopBrowserRecording,
    startManualRecording,
    stopManualRecording
  ])

  // Initialize browser STT service
  useEffect(() => {
    if (recordingMethod === 'browser' && isBrowserSpeechSupported()) {
      sttServiceRef.current = new SpeechToTextService({
        lang,
        interimResults: true,
        continuous: false,
        maxDurationMs: 10000,
        onResult: (finalTranscript, interimTranscript) => {
          if (finalTranscript) {
            setInputAction(prev => prev + finalTranscript + '. ')
            setIsRecording(false)
          } else {
            console.log('Interim:', interimTranscript)
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

    // Cleanup on unmount
    return () => {
      if (sttServiceRef.current) {
        sttServiceRef.current.stop()
        sttServiceRef.current = null
      }
      cleanupMediaResources()
    }
  }, [recordingMethod, lang, setInputAction, isBrowserSpeechSupported, cleanupMediaResources])

  return {
    isRecording,
    isProcessingAudio,
    handleRecordingToggle,
    startRecording: recordingMethod === 'browser' ? startBrowserRecording : startManualRecording,
    stopRecording: recordingMethod === 'browser' ? stopBrowserRecording : stopManualRecording
  }
}
