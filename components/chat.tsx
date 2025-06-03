'use client'

import { CHAT_ID } from '@/lib/constants'
import { useVoiceSettings } from '@/lib/store/voiceSettings'
import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { SpeechToTextService } from '@/services/stt'
import { useChat } from '@ai-sdk/react'
import { ChatRequestOptions } from 'ai'
import { Message } from 'ai/react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import { cleanForTTS } from './message'

// Define section structure
interface ChatSection {
  id: string // User message ID
  userMessage: Message
  assistantMessages: Message[]
}

type RecordingMethod = 'browser' | 'manual'

export function Chat({
  id,
  savedMessages = [],
  query,
  models
}: {
  id: string
  savedMessages?: Message[]
  query?: string
  models?: Model[]
}) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false)

  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingMethod] = useState<RecordingMethod>('browser')
  const [transcript, setTranscript] = useState<string>('')
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false)

  // Browser Speech Recognition (now using SpeechToTextService)
  const sttServiceRef = useRef<SpeechToTextService | null>(null)

  // Manual recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
    stop,
    append,
    data,
    setData,
    addToolResult,
    reload
  } = useChat({
    initialMessages: savedMessages,
    id: CHAT_ID,
    body: {
      id
    },
    onFinish: async msg => {
      if (msg.role === 'assistant') {
        console.log('generating speech')
        await generateSpeech(msg.content)
      }
      // window.history.replaceState({}, '', `/search/${id}`)
      // window.dispatchEvent(new CustomEvent('chat-history-updated'))
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: false, // Disable extra message fields,
    experimental_throttle: 100
  })

  const { voiceEngine, outputMode } = useVoiceSettings()

  const generateSpeech = useCallback(async (content: string): Promise<void> => {
    setIsGeneratingAudio(true)
    setIsTTSPlaying(true)
    try {
      const cleanedContent = cleanForTTS(content)
      const response = await fetch('/api/tts/playht', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cleanedContent, voiceEngine, outputMode })
      })

      if (!response.ok) {
        throw new Error('TTS request failed')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.src = audioUrl
        await audioRef.current.play()

        audioRef.current.addEventListener(
          'ended',
          () => {
            URL.revokeObjectURL(audioUrl)
            setIsTTSPlaying(false)
          },
          { once: true }
        )
      } else {
        setIsTTSPlaying(false)
      }
    } catch (error) {
      console.error('Audio generation/playback failed:', error)
      setIsTTSPlaying(false)
    } finally {
      setIsGeneratingAudio(false)
    }
  }, [voiceEngine, outputMode])

  // ASR
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    ) {
      sttServiceRef.current = new SpeechToTextService({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        maxDurationMs: 10000, // 10 seconds max recording duration
        onResult: (finalTranscript, interimTranscript) => {
          if (finalTranscript) {
            setTranscript('')
            setInput(prev => prev + finalTranscript + '. ')
            setIsRecording(false)
          } else {
            setTranscript(interimTranscript)
          }
        },
        onError: (error) => {
          console.log('Speech recognition error:', error)
          setIsRecording(false)
          setTranscript('')
        },
        onEnd: () => {
          setIsRecording(false)
          setTranscript('')
        }
      })
    }
  }, [setInput])

  const startBrowserRecording = (): void => {
    if (sttServiceRef.current && !isRecording) {
      setIsRecording(true)
      setTranscript('')
      sttServiceRef.current.start()
    }
  }
  const stopBrowserRecording = (): void => {
    if (sttServiceRef.current && isRecording) {
      sttServiceRef.current.stop()
    }
  }

  const startManualRecording = async (): Promise<void> => {
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

        // Clean up
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
  }

  const stopManualRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudioFile = async (audioBlob: Blob): Promise<void> => {
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
  }

  const handleRecordingToggle = (): void => {
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
  }
  const isBrowserSpeechSupported =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  const isLoading = status === 'submitted' || status === 'streaming'

  // Convert messages array to sections array
  const sections = useMemo<ChatSection[]>(() => {
    const result: ChatSection[] = []
    let currentSection: ChatSection | null = null

    for (const message of messages) {
      if (message.role === 'user') {
        // Start a new section when a user message is found
        if (currentSection) {
          result.push(currentSection)
        }
        currentSection = {
          id: message.id,
          userMessage: message,
          assistantMessages: []
        }
      } else if (currentSection && message.role === 'assistant') {
        // Add assistant message to the current section
        currentSection.assistantMessages.push(message)
      }
      // Ignore other role types like 'system' for now
    }

    // Add the last section if exists
    if (currentSection) {
      result.push(currentSection)
    }

    return result
  }, [messages])

  // Detect if scroll container is at the bottom
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const threshold = 50 // threshold in pixels
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        setIsAtBottom(true)
      } else {
        setIsAtBottom(false)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Set initial state

    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to the section when a new user message is sent
  useEffect(() => {
    if (sections.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'user') {
        // If the last message is from user, find the corresponding section
        const sectionId = lastMessage.id
        requestAnimationFrame(() => {
          const sectionElement = document.getElementById(`section-${sectionId}`)
          sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
  }, [sections, messages])

  useEffect(() => {
    setMessages(savedMessages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onQuerySelect = (query: string) => {
    append({
      role: 'user',
      content: query
    })
  }

  const handleUpdateAndReloadMessage = async (
    messageId: string,
    newContent: string
  ) => {
    setMessages(currentMessages =>
      currentMessages.map(msg =>
        msg.id === messageId ? { ...msg, content: newContent } : msg
      )
    )

    try {
      const messageIndex = messages.findIndex(msg => msg.id === messageId)
      if (messageIndex === -1) return

      const messagesUpToEdited = messages.slice(0, messageIndex + 1)

      setMessages(messagesUpToEdited)

      setData(undefined)

      await reload({
        body: {
          chatId: id,
          regenerate: true
        }
      })
    } catch (error) {
      console.error('Failed to reload after message update:', error)
      toast.error(`Failed to reload conversation: ${(error as Error).message}`)
    }
  }

  const handleReloadFrom = async (
    messageId: string,
    options?: ChatRequestOptions
  ) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex !== -1) {
      const userMessageIndex = messages
        .slice(0, messageIndex)
        .findLastIndex(m => m.role === 'user')
      if (userMessageIndex !== -1) {
        const trimmedMessages = messages.slice(0, userMessageIndex + 1)
        setMessages(trimmedMessages)
        return await reload(options)
      }
    }
    return await reload(options)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined)
    handleSubmit(e)
  }

  return (
    <div
      className={cn(
        'relative flex h-full min-w-0 flex-1 flex-col',
        messages.length === 0 ? 'items-center justify-center' : ''
      )}
      data-testid="full-chat"
    >
      <div className="absolute hidden z-0 opacity-40 left-0 top-0">
        <Image
          src={'/images/light.jpeg'}
          width={0}
          height={0}
          alt=""
          className="h-screen w-auto"
          unoptimized
        />
      </div>
      <ChatMessages
        sections={sections}
        data={data}
        onQuerySelect={onQuerySelect}
        isLoading={isLoading || isGeneratingAudio}
        chatId={id}
        addToolResult={addToolResult}
        scrollContainerRef={scrollContainerRef}
        onUpdateMessage={handleUpdateAndReloadMessage}
        reload={handleReloadFrom}
        isTTSPlaying={isTTSPlaying}
      />
      <ChatPanel
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={onSubmit}
        isLoading={isLoading}
        messages={messages}
        setMessages={setMessages}
        stop={stop}
        query={query}
        append={append}
        models={models}
        showScrollToBottomButton={!isAtBottom}
        scrollContainerRef={scrollContainerRef}
        voiceToggle={handleRecordingToggle}
        voiceRecording={isProcessingAudio || isRecording}
      />
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}
