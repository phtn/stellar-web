'use client'

import { MessageCtx } from '@/ctx/chat/message-ctx'
import { useTools } from '@/lib/hooks/use-tools'
import { cn } from '@/lib/utils'
import { ChatRequestOptions, JSONValue } from 'ai'
import { RefObject, useCallback, useContext, useEffect, useMemo } from 'react'
import { RenderMessage } from './render-message'
import { ToolSection } from './tool-section'
import { Spinner } from './ui/spinner'
import { AudioState, AudioStates } from '@/lib/hooks/use-audio-playback'

interface ChatMessagesProps {
  data: JSONValue[] | undefined
  onQuerySelectAction: (query: string) => void
  isLoading: boolean
  chatId?: string
  addToolResult?: (params: { toolCallId: string; result: any }) => void
  /** Ref for the scroll container */
  scrollContainerRef: RefObject<HTMLDivElement>
  onUpdateMessage?: (messageId: string, newContent: string) => Promise<void>
  reload?: (
    messageId: string,
    options?: ChatRequestOptions
  ) => Promise<string | null | undefined>
  audioStates?: AudioStates
}

export function ChatMessages({
  data,
  chatId,
  reload,
  isLoading,
  addToolResult,
  onQuerySelectAction,
  onUpdateMessage,
  scrollContainerRef,
  audioStates = {} as AudioStates
}: ChatMessagesProps) {
  const manualToolCallId = 'manual-tool-call'

  const { handleOpenChange, on, sections } = useContext(MessageCtx)!

  // get last tool data for manual tool call
  const { lastToolData } = useTools(data)

  const handleReload = useCallback(
    async (id: string) => reload && (await reload(id)),
    [reload]
  )

  // Optimize scroll logic with requestAnimationFrame
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Use requestAnimationFrame for smooth scrolling
    const scrollToBottom = () => {
      if (container.scrollHeight > container.clientHeight) {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight
        })
      }
    }

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 0)

    return () => clearTimeout(timeoutId)
  }, [sections.length, scrollContainerRef])

  // Memoize loading indicator check
  const showLoading = useMemo(
    () =>
      isLoading &&
      sections.length > 0 &&
      sections?.[sections.length - 1].assistantMessages.length === 0,
    [isLoading, sections]
  )

  // Memoize last section style
  const getLastSectionStyle = useCallback(
    (sectionIndex: number) =>
      sectionIndex === sections.length - 1
        ? { minHeight: 'calc(40vh)' }
        : undefined,
    [sections.length]
  )

  return (
    <div
      role="list"
      id="scroll-container"
      ref={scrollContainerRef}
      aria-roledescription="chat messages"
      className={cn('w-full h-full flex-1 overflow-y-auto pt-20 pb-32')}
    >
      <div className="relative mx-auto w-full max-w-3xl px-4">
        {sections?.map((section, sectionIndex) => (
          <div
            key={section.id}
            id={`section-${section.id}`}
            className="chat-section mb-8"
            style={getLastSectionStyle(sectionIndex)}
          >
            {/* User message */}
            <div className="flex font-space flex-col items-end gap-4 mb-8">
              <RenderMessage
                chatId={chatId}
                message={section.userMessage}
                addToolResult={addToolResult}
                onUpdateMessage={onUpdateMessage}
                messageId={section.userMessage.id}
                onOpenChangeAction={handleOpenChange}
                onQuerySelectAction={onQuerySelectAction}
                audioUrl={audioStates[section.userMessage.id]?.url}
                audioStatus={audioStates[section.userMessage.id]?.status}
              />
              {showLoading && sectionIndex === sections.length - 1 && (
                <Spinner />
              )}
            </div>

            {/* Assistant messages */}
            {section.assistantMessages.map(message => (
              <div key={message.id} className="flex flex-col p-3 gap-4">
                <RenderMessage
                  chatId={chatId}
                  message={message}
                  messageId={message.id}
                  addToolResult={addToolResult}
                  onUpdateMessage={onUpdateMessage}
                  onOpenChangeAction={handleOpenChange}
                  audioUrl={audioStates[message.id]?.url}
                  onQuerySelectAction={onQuerySelectAction}
                  audioStatus={audioStates[message.id]?.status}
                />
              </div>
            ))}
          </div>
        ))}

        {showLoading && lastToolData && (
          <ToolSection
            isOpen={on}
            tool={lastToolData}
            key={manualToolCallId}
            addToolResult={addToolResult}
            onOpenChange={open => handleOpenChange(manualToolCallId, open)}
          />
        )}
      </div>
    </div>
  )
}
