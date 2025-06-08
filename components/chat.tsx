'use client'

import { getVoice } from '@/app/actions'
import { CHAT_ID } from '@/lib/constants'
import {
  addMessage,
  createConversation,
  getConversation,
  getMessages,
  getRecentConversationsForUser,
  updateMessageWithAudioUrl,
  uploadVoiceResponse
} from '@/lib/firebase/conversations'
import { db } from '@/lib/firebase/index'
import { useVoiceSettings } from '@/lib/store/voiceSettings'
import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { SpeechToTextService } from '@/services/stt'
import { useChat } from '@ai-sdk/react'
import { ChatRequestOptions } from 'ai'
import { Message } from 'ai/react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
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

// Add a function to detect actions/gestures
function isActionOrGesture(content: string) {
  const trimmed = content.trim()
  // Matches *action*, /action/, (action), possibly with whitespace
  return (
    /^\*.*\*$/.test(trimmed) ||
    /^\/.*\/$/.test(trimmed) ||
    /^\(.*\)$/.test(trimmed)
  )
}

type AudioStatus =
  | 'idle'
  | 'receiving'
  | 'uploading'
  | 'uploaded'
  | 'playable'
  | 'playing'
  | 'error'
type AudioState = {
  url?: string
  status: AudioStatus
  error?: string
}

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
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false)

  // Browser Speech Recognition (now using SpeechToTextService)
  const sttServiceRef = useRef<SpeechToTextService | null>(null)

  // Manual recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)

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
      if (
        msg.role === 'assistant' &&
        msg.content.trim() &&
        !isActionOrGesture(msg.content)
      ) {
        setPendingAssistantMsg(msg)
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

  const { voiceEngine, outputMode, voice, setVoice } = useVoiceSettings()

  const [audioStates, setAudioStates] = useState<Record<string, AudioState>>({})

  const [pendingAssistantMsg, setPendingAssistantMsg] =
    useState<Message | null>(null)

  const generateSpeech = useCallback(
    async (msg: Message, convId: string): Promise<void> => {
      const msgId = msg.id
      console.log('[AUDIO] Starting TTS for msgId:', msgId)

      setAudioStates(prev => ({ ...prev, [msgId]: { status: 'receiving' } }))
      console.log('[AUDIO] Status set to receiving for', msgId)

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
        console.log('[AUDIO] TTS audio blob received for', msgId, audioBlob)

        setAudioStates(prev => ({ ...prev, [msgId]: { status: 'uploading' } }))
        console.log('[AUDIO] Status set to uploading for', msgId)

        // Ensure convId is not null
        if (!convId) {
          setAudioStates(prev => ({
            ...prev,
            [msgId]: { status: 'error', error: 'No conversationId' }
          }))
          console.error('[AUDIO] No conversationId for', msgId)
          return
        }
        console.log('[AUDIO] Using conversationId:', convId)

        // 2. Upload to Firebase Storage
        const storageUrl = await uploadVoiceResponse(convId, msgId, audioBlob)
        console.log('[AUDIO] Uploaded to storage. URL:', storageUrl)

        setAudioStates(prev => ({
          ...prev,
          [msgId]: { status: 'uploaded', url: storageUrl }
        }))
        console.log('[AUDIO] Status set to uploaded for', msgId)

        // 3. Update Firestore
        await updateMessageWithAudioUrl(convId, msgId, storageUrl)
        console.log('[AUDIO] Firestore updated with audioUrl for', msgId)

        setAudioStates(prev => ({
          ...prev,
          [msgId]: { status: 'playable', url: storageUrl }
        }))
        console.log('[AUDIO] Status set to playable for', msgId)

        // 4. Optionally, play the audio
        if (audioRef.current) {
          audioRef.current.src = storageUrl
          console.log(
            '[AUDIO] Set audioRef src and attempting to play for',
            msgId
          )
          await audioRef.current.play()
          setAudioStates(prev => ({
            ...prev,
            [msgId]: { ...prev[msgId], status: 'playing' }
          }))
          console.log('[AUDIO] Status set to playing for', msgId)
          audioRef.current.addEventListener(
            'ended',
            () => {
              setAudioStates(prev => ({
                ...prev,
                [msgId]: { ...prev[msgId], status: 'playable' }
              }))
              setIsTTSPlaying(false)
              console.log(
                '[AUDIO] Playback ended, status set to playable for',
                msgId
              )
            },
            { once: true }
          )
        } else {
          setIsTTSPlaying(false)
          console.warn('[AUDIO] audioRef.current is null for', msgId)
        }
      } catch (error: any) {
        setAudioStates(prev => ({
          ...prev,
          [msgId]: { status: 'error', error: error.message }
        }))
        setIsTTSPlaying(false)
        console.error('[AUDIO] Error for', msgId, error)
      } finally {
        setIsGeneratingAudio(false)
        console.log('[AUDIO] Done for', msgId)
      }
    },
    [voiceEngine, outputMode, voice]
  )

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

  const startBrowserRecording = (): void => {
    if (sttServiceRef.current && !isRecording) {
      setIsRecording(true)
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

  // If id is present (from route/props), use it as conversationId and mark as started
  useEffect(() => {
    if (id && !conversationId) {
      setConversationId(id)
      setHasStarted(true)
    }
  }, [id, conversationId])

  // Ensure existing conversation doc has all required fields
  useEffect(() => {
    async function ensureConversationFields() {
      if (id && conversationId === id) {
        const convo = await getConversation(id)
        let needsUpdate = false
        const updateData: any = {}
        if (!convo) return // doc doesn't exist, don't update
        if (!convo.title) {
          updateData.title = 'Conversation'
          needsUpdate = true
        }
        if (!convo.assistantName) {
          updateData.assistantName = 'Assistant'
          needsUpdate = true
        }
        if (!convo.createdAt) {
          updateData.createdAt = serverTimestamp()
          needsUpdate = true
        }
        if (!convo.userId) {
          updateData.userId = 'demo-user'
          needsUpdate = true
        }
        if (needsUpdate) {
          await updateDoc(doc(db, 'conversations', id), updateData)
        }
      }
    }
    ensureConversationFields()
  }, [id, conversationId])

  const handleFirstMessage = useCallback(
    async (message: Message) => {
      // Only create a new conversation if conversationId is not set
      if (!conversationId) {
        // TODO: Replace with actual user id from auth
        const userId = 'demo-user'
        const assistantName = (await getVoice()) || 'Assistant'
        const convId = await createConversation(
          userId,
          message.content.slice(0, 32),
          assistantName
        )
        setConversationId(convId)
        await addMessage(convId, message.id, message.role, message.content)
        setHasStarted(true)
      }
    },
    [conversationId]
  )

  const handleSubsequentMessage = useCallback(
    async (message: Message) => {
      if (conversationId) {
        await addMessage(
          conversationId,
          message.id,
          message.role,
          message.content
        )
      }
    },
    [conversationId]
  )

  // Intercept message sending
  useEffect(() => {
    if (!messages.length) return
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role === 'user') {
      if (!hasStarted) {
        handleFirstMessage(lastMessage)
      } else {
        handleSubsequentMessage(lastMessage)
      }
    }
  }, [messages, hasStarted, handleFirstMessage, handleSubsequentMessage])

  // Only load Firestore messages on initial conversation load and if chat is empty
  const initialLoadRef = useRef(false)
  useEffect(() => {
    if (conversationId && !initialLoadRef.current && messages.length === 0) {
      ;(async () => {
        const msgs = await getMessages(conversationId)
        setMessages(
          msgs.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content
            // Do not include audioUrl here
          }))
        )
        initialLoadRef.current = true
      })()
    }
  }, [conversationId, setMessages, messages.length])

  // Fetch 10 recent conversations for context
  const fetchRecentConversations = useCallback(async () => {
    // TODO: Replace with actual user id from auth
    const userId = 'demo-user'
    const recentConvos = await getRecentConversationsForUser(userId, 10)
    // Use recentConvos as needed for context
    return recentConvos
  }, [])

  // Optionally, fetch recent conversations on mount or when needed
  useEffect(() => {
    fetchRecentConversations()
  }, [fetchRecentConversations])

  useEffect(() => {
    if (conversationId && pendingAssistantMsg) {
      ;(async () => {
        await addMessage(
          conversationId,
          pendingAssistantMsg.id,
          pendingAssistantMsg.role,
          pendingAssistantMsg.content
        )
        await generateSpeech(pendingAssistantMsg, conversationId)
        setPendingAssistantMsg(null)
      })()
    }
  }, [conversationId, pendingAssistantMsg, generateSpeech])

  useEffect(() => {
    // Initialize audioStates for messages with audioUrl (e.g., when loading a conversation)
    if (savedMessages && savedMessages.length > 0) {
      setAudioStates(prev => {
        const newStates = { ...prev }
        for (const msg of savedMessages as any[]) {
          if (msg.audioUrl) {
            newStates[msg.id] = { url: msg.audioUrl, status: 'playable' }
          }
        }
        return newStates
      })
    }
  }, [savedMessages])

  return (
    <div
      className={cn(
        'relative flex h-full min-w-0 flex-1 flex-col',
        messages.length === 0 ? 'items-center justify-center' : ''
      )}
      data-testid="full-chat"
    >
      <ChatMessages
        chatId={id}
        data={data}
        sections={sections}
        reload={handleReloadFrom}
        isTTSPlaying={isTTSPlaying}
        onQuerySelect={onQuerySelect}
        addToolResult={addToolResult}
        scrollContainerRef={scrollContainerRef}
        isLoading={isLoading ?? isGeneratingAudio}
        onUpdateMessage={handleUpdateAndReloadMessage}
        audioStates={audioStates}
      />
      <ChatPanel
        stop={stop}
        input={input}
        query={query}
        append={append}
        models={models}
        messages={messages}
        isLoading={isLoading}
        handleSubmit={onSubmit}
        setMessages={setMessages}
        voiceToggle={handleRecordingToggle}
        handleInputChange={handleInputChange}
        showScrollToBottomButton={!isAtBottom}
        scrollContainerRef={scrollContainerRef}
        voiceRecording={isProcessingAudio || isRecording}
        setVoice={setVoice}
      />
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}
