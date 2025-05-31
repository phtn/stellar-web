import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { Message } from 'ai'
import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useArtifact } from './artifact/artifact-context'
import { Babes, ToggleFeature } from './babes'
import { EmptyScreen } from './empty-screen'
import { IconBtn } from './icon-btn'
import { Button } from './ui/button'

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
  voiceRecording
}: ChatPanelProps) {
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false) // Composition state
  const [enterDisabled, setEnterDisabled] = useState(false) // Disable Enter after composition ends
  const { close: closeArtifact } = useArtifact()

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
          disabled: voiceRecording
        }}
        solid={!voiceRecording}
        iconStyle={
          voiceRecording
            ? 'size-3.5 text-indigo-500 dark:text-indigo-500'
            : undefined
        }
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
      iconStyle={cn(
        'text-teal-200 dark:text-teal-200',
        'disabled:text-foreground/80 disabled:bg-foreground/20 rounded-xl'
      )}
      withShadow
      icon={isLoading ? 'spinners-ring' : 'arrow-up-broken'}
      shadowStyle="text-zinc-950"
      animated
    />
  )

  return (
    <div
      className={cn(
        'w-full relative z-10 group/form-container shrink-0',
        messages.length > 0 ? 'sticky bottom-0 px-2 pb-4' : 'px-6'
      )}
    >
      {messages.length === 0 && <Babes />}
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
            'dark:bg-muted/70 bg-muted/40',
            'rounded-3xl border-[0.75px] dark:border-muted/10 border-neutral-300',
            { 'border-neutral-400': showEmptyScreen }
          )}
        >
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
            className="resize-none w-full min-h-12 bg-transparent font-space border-0 p-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                icon="phone-bold"
                label="Search"
                fn={() => console.log('')}
              />
              <ToggleFeature
                icon="phone-bold"
                label="Think"
                fn={() => console.log('')}
              />
              <ToggleFeature
                icon="phone-bold"
                label="Code"
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
