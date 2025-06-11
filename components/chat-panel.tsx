'use client'

import { Voices } from '@/lib/store/voiceSettings'
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
import { set } from 'zod'

interface ChatPanelProps {
  input: string
  handleInputChangeAction: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmitAction: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  query?: string
  stopAction: () => void
  appendAction: (message: any) => void
  models?: Model[]
  /** Whether to show the scroll to bottom button */
  showScrollToBottomButton: boolean
  /** Reference to the scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement>
  voiceToggle: VoidFunction
  voiceRecording: boolean
  setVoiceAction: (voice: Voices) => void
}

export function ChatPanel({
  input,
  handleInputChangeAction,
  handleSubmitAction,
  isLoading,
  messages,
  query,
  stopAction,
  appendAction,
  showScrollToBottomButton,
  scrollContainerRef,
  voiceToggle,
  voiceRecording,
  setVoiceAction
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
      appendAction({
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
        iconStyle={cn(
          'group-hover:text-sky-600 dark:group-hover:text-sky-400',
          {
            'size-5 text-indigo-400 dark:text-indigo-500': voiceRecording
          }
        )}
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
      iconSize={20}
      iconStyle={cn('text-teal-300 ', {
        'text-zinc-800':
          (input.length === 0 && !isLoading) || isToolInvocationInProgress()
      })}
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
      appendAction({
        role: 'user',
        content: "What's good?"
      })
      setVoiceAction(voice)
    },
    [setVoiceAction, appendAction]
  )

  const setFocus = useCallback(() => {
    inputRef?.current?.focus()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      setFocus()
    }
  }, [setFocus, isLoading])

  return (
    <div
      className={cn(
        'w-full sticky z-10 pb-6 md:px-6 px-2 group/form-container shrink-0',
        {
          'sticky bottom-0 px-2 pb-4': messages.length > 0,
          '': messages.length === 0
        }
      )}
    >
      {messages.length === 0 && <Babes startVoiceChatAction={startVoiceChat} />}
      <form
        onSubmit={handleSubmitAction}
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
              handleInputChangeAction(e)
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
                setFocus()
              }
            }}
            onFocus={() => setShowEmptyScreen(true)}
          />

          {/* Bottom menu area */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-0">
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
                icon="ai-coder"
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
              handleInputChangeAction({
                target: { value: message }
              } as React.ChangeEvent<HTMLTextAreaElement>)
            }}
            className={cn('hidden', showEmptyScreen ? 'visible' : 'invisible')}
          />
        )}
      </form>
    </div>
  )
}
