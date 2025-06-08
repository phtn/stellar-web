'use client'

import { getVoice } from '@/app/actions'
import {
  getMessages,
  getRecentConversationsForUser,
  updateMessageWithAudioUrl,
  uploadVoiceResponse
} from '@/lib/firebase/conversations'
import { useAudioPlayback } from '@/lib/hooks/use-audio-playback'
import { useAutoScroll } from '@/lib/hooks/use-auto-scroll'
import { useConversation } from '@/lib/hooks/use-conversation'
import { useVoiceRecorder } from '@/lib/hooks/use-voice-recorder'
import { useVoiceSettings } from '@/lib/store/voiceSettings'
import type { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { useChat } from '@ai-sdk/react'
import { ChatRequestOptions } from 'ai'
import type { Message } from 'ai/react'
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
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

interface IChat {
  id: string
  query?: string
  models?: Model[]
  savedMessages?: Message[]
}
export function Chat({ id, savedMessages = [], query, models }: IChat) {
  // Use the new auto scroll hook
  const { scrollContainerRef, isAtBottom, scrollToSection } = useAutoScroll()

  // Add audioRef for useAudioPlayback and <audio>
  const audioRef = useRef<HTMLAudioElement>(null)

  // Use the new hook for Firestore logic
  const {
    conversationId,
    setConversationId,
    hasStarted,
    setHasStarted,
    createConversation,
    addMessage
  } = useConversation({ id, savedMessages })

  // Use useChat for chat UI logic
  const {
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    append,
    data,
    setData,
    addToolResult,
    reload,
    messages,
    setMessages
  } = useChat({
    initialMessages: savedMessages,
    id,
    body: { id },
    onFinish: async msg => {
      if (
        msg.role === 'assistant' &&
        msg.content.trim() &&
        !isActionOrGesture(msg.content)
      ) {
        setPendingAssistantMsg(msg)
      }
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: false,
    experimental_throttle: 100
  })

  const { voiceEngine, outputMode, voice, setVoice } = useVoiceSettings()

  // Use the new audio playback hook
  const {
    audioStates,
    setAudioStates,
    generateSpeech,
    isTTSPlaying,
    isGeneratingAudio
  } = useAudioPlayback({
    voiceEngine,
    outputMode,
    voice,
    audioRef,
    uploadVoiceResponse,
    updateMessageWithAudioUrl,
    cleanForTTS
  })

  const [pendingAssistantMsg, setPendingAssistantMsg] =
    useState<Message | null>(null)

  // Use the new voice recorder hook
  const {
    isRecording,
    isProcessingAudio,
    handleRecordingToggle,
    initializeSTT
  } = useVoiceRecorder({ setInput })

  // Initialize browser STT service on mount
  useEffect(() => {
    initializeSTT()
  }, [initializeSTT])

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

  // Replace scroll-to-section effect with:
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'user') {
        scrollToSection(lastMessage.id)
      }
    }
  }, [messages, scrollToSection])

  const onQuerySelect = useCallback(
    (query: string) => {
      append({
        role: 'user',
        content: query
      })
    },
    [append]
  )

  const handleUpdateAndReloadMessage = useCallback(
    async (messageId: string, newContent: string) => {
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
        toast.error(
          `Failed to reload conversation: ${(error as Error).message}`
        )
      }
    },
    [messages, setMessages, setData, reload, id]
  )

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

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined)
    handleSubmit(e)
  }

  // Update handleFirstMessage to use hook
  const handleFirstMessage = useCallback(
    async (message: Message) => {
      // Always call createConversation for the first user message
      const userId = 'demo-user'
      const assistantName = (await getVoice()) ?? 'Assistant'

      try {
        const convId = await createConversation(
          userId,
          message.content.slice(0, 32),
          assistantName
        )
        setConversationId(convId)
        await addMessage(convId, message.id, message.role, message.content)
        setHasStarted(true)
      } catch (err) {
        console.error('[handleFirstMessage] createConversation error', err)
      }
    },
    [createConversation, addMessage, setConversationId, setHasStarted]
  )

  // Update handleSubsequentMessage to use hook
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
    [conversationId, addMessage]
  )

  // Intercept message sending
  useEffect(() => {
    if (!messages.length) return
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role === 'user') {
      if (!hasStarted) {
        console.log(
          '[useEffect:messages] calling handleFirstMessage',
          lastMessage
        )
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
  }, [savedMessages, setAudioStates])

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
  }, [conversationId, pendingAssistantMsg, generateSpeech, addMessage])

  return (
    <div
      className={cn(
        'relative flex h-full flex-1 flex-col',
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
        isLoading={
          status === 'submitted' || status === 'streaming' || isGeneratingAudio
        }
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
        isLoading={status === 'submitted' || status === 'streaming'}
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
