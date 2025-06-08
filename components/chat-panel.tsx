import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { Message } from 'ai'
import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { Babes, ToggleFeature } from './babes'
import { EmptyScreen } from './empty-screen'
import { IconBtn } from './icon-btn'
import { Button } from './ui/button'
import { Voices } from '@/lib/store/voiceSettings'

interface ChatPanelProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  query?: string
  stop: () => void
  append: (message: any) => void
  models?: Model[]
  /** Whether to show the scroll to bottom button */
  showScrollToBottomButton: boolean
  /** Reference to the scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement>
  voiceToggle: VoidFunction
  voiceRecording: boolean
  setVoice: (voice: Voices) => void
}

export function ChatPanel({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  messages,
  query,
  stop,
  append,
  showScrollToBottomButton,
  scrollContainerRef,
  voiceToggle,
  voiceRecording,
  setVoice
}: ChatPanelProps) {
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false) // Composition state
  const [enterDisabled, setEnterDisabled] = useState(false) // Disable Enter after composition ends
  // const { close: closeArtifact } = useArtifact()

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  // const handleNewChat = () => {
  //   setMessages([])
  //   closeArtifact()
  //   router.push('/')
  // }

  const isToolInvocationInProgress = useCallback(() => {
    if (!messages.length) return false

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant' || !lastMessage.parts) return false

    const parts = lastMessage.parts
    const lastPart = parts[parts.length - 1]

    return (
      lastPart?.type === 'tool-invocation' &&
      lastPart?.toolInvocation?.state === 'call'
    )
  }, [messages])

  // if query is not empty, submit the query
  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      append({
        role: 'user',
        content: query
      })
      isFirstRender.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  // Scroll to the bottom of the container
  const handleScrollToBottom = () => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  const VoiceToggle = useCallback(
    () => (
      <IconBtn
        btnProps={{
          onClick: voiceToggle,
          disabled: false
        }}
        solid={!voiceRecording}
        iconSize={20}
        iconStyle={cn({
          'size-5 text-indigo-400 dark:text-indigo-500': voiceRecording
        })}
        withShadow={voiceRecording}
        icon={voiceRecording ? 'spinners-bars-middle' : 'microphone-noir'}
      />
    ),
    [voiceRecording, voiceToggle]
  )

  const SendMessage = () => (
    <IconBtn
      btnProps={{
        onClick: isLoading ? stop : undefined,
        disabled:
          (input.length === 0 && !isLoading) || isToolInvocationInProgress(),
        type: isLoading ? 'button' : 'submit'
      }}
      solid={!voiceRecording}
      // iconStyle={cn(
      //   'text-teal-800/40 dark:text-teal-200',
      //   'disabled:text-foreground/80 disabled:bg-foreground/20 rounded-xl',
      //   'dark:group-hover:text-cyan-200'
      // )}
      withShadow
      icon={isLoading ? 'spinners-ring' : 'arrow-up-broken'}
      shadowStyle="text-stone-950"
      animated
    />
  )

  const startVoiceChat = useCallback(
    (voice: Voices) => {
      append({
        role: 'user',
        content: "What's good?"
      })
      setVoice(voice)
    },
    [setVoice, append]
  )

  return (
    <div
      className={cn(
        'w-full relative z-10 group/form-container shrink-0',
        messages.length > 0 ? 'sticky bottom-0 px-2 pb-4' : 'px-6'
      )}
    >
      {messages.length === 0 && <Babes startVoiceChat={startVoiceChat} />}
      <form
        onSubmit={handleSubmit}
        className={cn('max-w-3xl w-full mx-auto relative')}
      >
        {/* Scroll to bottom button - only shown when showScrollToBottomButton is true */}
        {showScrollToBottomButton && messages.length > 0 && (
          <Button
            size="icon"
            type="button"
            variant="outline"
            title="Scroll to bottom"
            onClick={handleScrollToBottom}
            className="absolute -top-10 right-4 z-20 size-8 rounded-full shadow-md"
          >
            <ChevronDown size={16} />
          </Button>
        )}

        <div
          className={cn(
            'relative flex flex-col w-full gap-2',
            'dark:bg-sidebar bg-muted/80 dark:border-muted/10',
            'rounded-3xl border-[0.75px] border-neutral-500',
            ' shadow-md shadow-stone-200/80 dark:shadow-none',
            'overflow-hidden',
            { 'border-neutral-600': showEmptyScreen }
          )}
        >
          {/*TEXTAREA GRADIENT BGs */}
          {/* DARK */}
          <div className="absolute pointer-events-none -top-20 right-48 w-[28rem] h-44 dark:bg-neutral-500 rounded-full blur-[69px] opacity-40"></div>
          <div className="absolute pointer-events-none -top-10 -right-56 w-[40rem] h-14 dark:bg-gradient-to-b from-cyan-100 to-cyan-200 rounded-full blur-[56px] -rotate-[30deg] opacity-20"></div>
          {/* LIGHT */}
          <div className="absolute pointer-events-none -top-6 -right-32 w-64 h-[10rem] rotate-45 dark:bg-transparent bg-cyan-200/40 rounded-full blur-[24px] shadow-inner opacity-40"></div>
          <div className="absolute pointer-events-none -top-0 -right-24 w-[28rem] h-[8rem] rotate-45 dark:bg-transparent bg-orange-200/40 rounded-full blur-[32px] opacity-40"></div>
          {/*  */}
          <Textarea
            rows={2}
            maxRows={5}
            name="input"
            tabIndex={0}
            value={input}
            ref={inputRef}
            spellCheck={false}
            placeholder="your reply"
            onCompositionEnd={handleCompositionEnd}
            onCompositionStart={handleCompositionStart}
            disabled={isLoading || isToolInvocationInProgress()}
            className="resize-none w-full min-h-12 bg-transparent font-space border-0 py-4 px-5 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            onChange={e => {
              handleInputChange(e)
              setShowEmptyScreen(e.target.value.length === 0)
            }}
            onKeyDown={e => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !isComposing &&
                !enterDisabled
              ) {
                if (input.trim().length === 0) {
                  e.preventDefault()
                  return
                }
                e.preventDefault()
                const textarea = e.target as HTMLTextAreaElement
                textarea.form?.requestSubmit()
              }
            }}
            onFocus={() => setShowEmptyScreen(true)}
            onBlur={() => setShowEmptyScreen(false)}
          />

          {/* Bottom menu area */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              {/* <ModelSelector models={models ?? []} /> */}
              <ToggleFeature
                label="Search"
                icon="search"
                fn={() => console.log('')}
              />
              <ToggleFeature
                label="Think"
                icon="ai-mind"
                fn={() => console.log('')}
              />
              <ToggleFeature
                label="Code"
                icon="phone-bold"
                fn={() => console.log('')}
              />
            </div>
            <div className="flex items-center gap-4">
              <VoiceToggle />
              <SendMessage />
            </div>
          </div>
        </div>

        {messages.length === 0 && (
          <EmptyScreen
            submitMessage={message => {
              handleInputChange({
                target: { value: message }
              } as React.ChangeEvent<HTMLTextAreaElement>)
            }}
            className={cn(showEmptyScreen ? 'visible' : 'invisible')}
          />
        )}
      </form>
    </div>
  )
}
