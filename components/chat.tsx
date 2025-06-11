'use client'

import { MessageCtx, MessageCtxProvider } from '@/ctx/chat/message-ctx'
import {
  updateMessageWithAudioUrl,
  uploadVoiceResponse
} from '@/lib/firebase/conversations'
import { useAudioPlayback } from '@/lib/hooks/use-audio-playback'
import { useAutoScroll } from '@/lib/hooks/use-auto-scroll'
import { useChatOptions } from '@/lib/hooks/use-chat-options'
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
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import { toast } from 'sonner'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'
import { cleanForTTS } from './message'

interface IChat {
  id: string
  query?: string
  models?: Model[]
  initialMessages?: Message[]
}

// Child component to sync context after sending
function ChatContextSync({
  id,
  messages
}: {
  id: string
  messages: Message[]
}) {
  const { loadMessages } = useContext(MessageCtx)!
  const loadedRef = useRef(false)

  // Load messages only once when component mounts with an id
  useEffect(() => {
    if (loadMessages && id && !loadedRef.current) {
      loadedRef.current = true
      loadMessages(id)
    }
  }, [id, loadMessages])

  return null
}

export function Chat({ id, initialMessages, query, models }: IChat) {
  const [assistant, setAssistantAction] = useState<Message | null>(null)
  // Use the new auto scroll hook
  const { scrollContainerRef, isAtBottom, scrollToSection } = useAutoScroll()

  // Use the new hook for Firestore logic
  const {
    convId,
    addMessage,
    hasStarted,
    handleFirstMessage,
    handleSubsequentMessage
  } = useConversation({ id })

  const chatOptions = useChatOptions({
    id,
    setAssistantAction,
    messages: initialMessages
  })

  // Use useChat for chat UI logic
  const {
    stop,
    data,
    input,
    append,
    status,
    reload,
    setData,
    messages,
    setInput,
    setMessages,
    handleSubmit,
    addToolResult,
    handleInputChange
  } = useChat(chatOptions)

  const { voiceEngine, outputMode, voice, setVoice } = useVoiceSettings()

  // Add audioRef for useAudioPlayback and <audio>
  const audioRef = useRef<HTMLAudioElement>(null)

  // Use the new audio playback hook
  const { audioStates, generateSpeech, setAudioStates, isGeneratingAudio } =
    useAudioPlayback({
      voice,
      audioRef,
      outputMode,
      voiceEngine,
      cleanForTTS,
      enabled: false,
      uploadVoiceResponse,
      updateMessageWithAudioUrl
    })

  // Use the new voice recorder hook
  const {
    isRecording,
    initializeSTT,
    isProcessingAudio,
    handleRecordingToggle
  } = useVoiceRecorder({ setInputAction: setInput })

  // Initialize browser STT service on mount
  useEffect(() => {
    initializeSTT()
  }, [initializeSTT])

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
        const messageIndex = messages.findIndex(({ id }) => id === messageId)
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

  // Update handleSubsequentMessage to use hook

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

  useEffect(() => {
    // Initialize audioStates for messages with audioUrl (e.g., when loading a conversation)
    if (initialMessages && initialMessages.length > 0) {
      setAudioStates(prev => {
        const newStates = { ...prev }
        for (const msg of initialMessages as any[]) {
          if (msg.audioUrl) {
            newStates[msg.id] = { url: msg.audioUrl, status: 'playable' }
          }
        }
        return newStates
      })
    }
  }, [initialMessages, setAudioStates])

  useEffect(() => {
    if (convId && assistant) {
      ; (async () => {
        await addMessage({ convId, message: assistant })
        await generateSpeech(assistant, convId)
        setAssistantAction(null)
      })()
    }
  }, [convId, assistant, generateSpeech, addMessage])

  return (
    <div
      data-testid="full-chat"
      className={cn(
        'relative flex h-full flex-1 flex-col',
        messages.length === 0 ? 'items-center justify-center' : ''
      )}
    >
      <MessageCtxProvider messages={messages}>
        <ChatContextSync id={id} messages={messages} />
        <ChatMessages
          data={data}
          chatId={id}
          reload={handleReloadFrom}
          onQuerySelectAction={onQuerySelect}
          addToolResult={addToolResult}
          scrollContainerRef={scrollContainerRef}
          isLoading={
            status === 'submitted' ||
            status === 'streaming' ||
            isGeneratingAudio
          }
          onUpdateMessage={handleUpdateAndReloadMessage}
          audioStates={audioStates}
        />
      </MessageCtxProvider>

      <ChatPanel
        stopAction={stop}
        input={input}
        query={query}
        appendAction={append}
        models={models}
        messages={messages}
        isLoading={status === 'submitted' || status === 'streaming'}
        handleSubmitAction={onSubmit}
        setMessages={setMessages}
        voiceToggle={handleRecordingToggle}
        handleInputChangeAction={handleInputChange}
        showScrollToBottomButton={!isAtBottom}
        scrollContainerRef={scrollContainerRef}
        voiceRecording={isProcessingAudio || isRecording}
        setVoiceAction={setVoice}
      />
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}
