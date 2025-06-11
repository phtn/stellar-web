'use client'

import { MessageCtx, SetMessage } from '@/ctx/chat/message-ctx'
import { useTools } from '@/lib/hooks/use-tools'
import { cn } from '@/lib/utils'
import { ChatRequestOptions, JSONValue } from 'ai'
import { RefObject, useCallback, useContext, useEffect } from 'react'
import { RenderMessage } from './render-message'
import { ToolSection } from './tool-section'
import { Spinner } from './ui/spinner'
import { ChatSection } from '@/ctx/chat/types'

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
  audioStates?: Record<string, { url?: string; status: string; error?: string }>
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
  audioStates = {}
}: ChatMessagesProps) {
  const manualToolCallId = 'manual-tool-call'

  const { handleOpenChange, on, loadMessages, sections } =
    useContext(MessageCtx)!

  useEffect(() => {
    if (chatId) loadMessages(chatId)
  }, [loadMessages, chatId])
  // useEffect(() => {
  //   console.log('[ChatMessages] sections:', sections)
  // }, [sections])

  // get last tool data for manual tool call
  const { lastToolData } = useTools(data)

  const handleReload = useCallback(
    async (id: string) => reload && (await reload(id)),
    [reload]
  )

  // Scroll to bottom on initial load or when new messages are added
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    // Only scroll if content overflows
    if (container.scrollHeight > container.clientHeight) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight
      }, 0)
    }
    console.log(container.clientHeight)
  }, [sections.length, scrollContainerRef])

  // Check if loading indicator should be shown
  const showLoading =
    isLoading &&
    sections.length > 0 &&
    sections?.[sections.length - 1].assistantMessages.length === 0

  return (
    <div
      role="list"
      id="scroll-container"
      ref={scrollContainerRef}
      aria-roledescription="chat messages"
      className={cn('w-full h-full flex-1 overflow-y-auto pt-20')}
    >
      <div className="relative mx-auto w-full max-w-3xl px-4">
        {sections?.map((section, sectionIndex) => (
          <div
            key={section.id}
            id={`section-${section.id}`}
            className="chat-section mb-8"
            style={
              sectionIndex === sections.length - 1
                ? { minHeight: 'calc(100dvh-428px)' }
                : {}
            }
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
              {showLoading && <Spinner />}
            </div>

            {/* Assistant messages */}
            {section.assistantMessages.map(message => (
              <div key={section.id} className="flex flex-col p-3 gap-4">
                <RenderMessage
                  chatId={chatId}
                  message={message}
                  messageId={section.id}
                  addToolResult={addToolResult}
                  onUpdateMessage={onUpdateMessage}
                  onOpenChangeAction={handleOpenChange}
                  audioUrl={audioStates[section.id]?.url}
                  onQuerySelectAction={onQuerySelectAction}
                  audioStatus={audioStates[section.id]?.status}
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
