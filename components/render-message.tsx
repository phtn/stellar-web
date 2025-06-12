'use client'

import { MessageCtx } from '@/ctx/chat/message-ctx'
import { JSONValue, Message, ToolInvocation } from 'ai'
import { useCallback, useContext, useMemo } from 'react'
import { AnswerSection } from './answer-section'
import { ReasoningSection } from './reasoning-section'
import RelatedQuestions from './related-questions'
import { ToolSection } from './tool-section'
import { UserMessage } from './user-message'
import { AudioStatus } from '@/lib/hooks/use-audio-playback'

interface RenderMessageProps {
  message: Message
  messageId: string
  onOpenChangeAction: (id: string, open: boolean) => void
  onQuerySelectAction: (query: string) => void
  chatId?: string
  addToolResult?: (params: { toolCallId: string; result: any }) => void
  onUpdateMessage?: (messageId: string, newContent: string) => Promise<void>
  audioUrl?: string
  audioStatus?: AudioStatus
}

export function RenderMessage({
  message,
  messageId,
  onOpenChangeAction,
  onQuerySelectAction,
  chatId,
  addToolResult,
  onUpdateMessage,
  audioUrl,
  audioStatus
}: RenderMessageProps) {
  const { getIsOpen } = useContext(MessageCtx)!

  const relatedQuestions = useMemo(
    () =>
      message.annotations?.filter(
        annotation => (annotation as any)?.type === 'related-questions'
      ),
    [message.annotations]
  )

  // Render for manual tool call
  const toolData = useMemo(() => {
    const toolAnnotations =
      (message.annotations?.filter(
        annotation =>
          (annotation as unknown as { type: string }).type === 'tool_call'
      ) as unknown as Array<{
        data: {
          args: string
          toolName: string
          result?: string
          toolCallId: string
          state: 'call' | 'result'
        }
      }>) || []

    const toolDataMap = toolAnnotations.reduce((acc, annotation) => {
      const existing = acc.get(annotation.data.toolCallId)
      if (!existing || annotation.data.state === 'result') {
        acc.set(annotation.data.toolCallId, {
          ...annotation.data,
          args: annotation.data.args ? JSON.parse(annotation.data.args) : {},
          result:
            annotation.data.result && annotation.data.result !== 'undefined'
              ? JSON.parse(annotation.data.result)
              : undefined
        } as ToolInvocation)
      }
      return acc
    }, new Map<string, ToolInvocation>())

    return Array.from(toolDataMap.values())
  }, [message.annotations])

  const handleOpenChange = useCallback(
    (id: string) => (open: boolean) => onOpenChangeAction(id, open),
    [onOpenChangeAction]
  )
  // Extract the unified reasoning annotation directly.
  const reasoningAnnotation = useMemo(() => {
    const annotations = message.annotations as any[] | undefined
    if (!annotations) return null
    return (
      annotations.find(a => a.type === 'reasoning' && a.data !== undefined) ||
      null
    )
  }, [message.annotations])

  // Extract the reasoning time and reasoning content from the annotation.
  // If annotation.data is an object, use its fields. Otherwise, default to a time of 0.
  const reasoningTime = useMemo(() => {
    if (!reasoningAnnotation) return 0
    if (
      typeof reasoningAnnotation.data === 'object' &&
      reasoningAnnotation.data !== null
    ) {
      return reasoningAnnotation.data.time ?? 0
    }
    return 0
  }, [reasoningAnnotation])

  if (message.role === 'user') {
    return (
      <UserMessage
        messageId={messageId}
        message={message.content}
        onUpdateMessage={onUpdateMessage}
      />
    )
  }

  // New way: Use parts instead of toolInvocations
  return (
    <>
      {toolData.map(tool => (
        <ToolSection
          key={tool.toolCallId}
          tool={tool}
          isOpen={getIsOpen(tool.toolCallId)}
          onOpenChange={open => onOpenChangeAction(tool.toolCallId, open)}
          addToolResult={addToolResult}
        />
      ))}
      {message.parts?.map((part, index) => {
        // Check if this is the last part in the array
        const isLastPart = index === (message.parts?.length ?? 0) - 1

        switch (part.type) {
          case 'tool-invocation':
            return (
              <ToolSection
                tool={part.toolInvocation}
                addToolResult={addToolResult}
                key={`${messageId}-tool-${index}`}
                isOpen={getIsOpen(part.toolInvocation.toolCallId)}
                onOpenChange={handleOpenChange(part.toolInvocation.toolCallId)}
              />
            )
          case 'text':
            // Only show actions if this is the last part and it's a text part
            return (
              <AnswerSection
                chatId={chatId}
                audioUrl={audioUrl}
                content={part.text}
                messageId={messageId}
                showActions={isLastPart}
                audioStatus={audioStatus}
                key={`${messageId}-text-${index}`}
                onOpenChange={handleOpenChange(messageId)}
              />
            )
          case 'reasoning':
            return (
              <ReasoningSection
                key={`${messageId}-reasoning-${index}`}
                content={{
                  time: reasoningTime,
                  reasoning: part.reasoning
                }}
                isOpen={getIsOpen(messageId)}
                onOpenChange={handleOpenChange(messageId)}
              />
            )
          // Add other part types as needed
          default:
            return null
        }
      })}
      {relatedQuestions && relatedQuestions.length > 0 && (
        <RelatedQuestions
          onQuerySelectAction={onQuerySelectAction}
          annotations={relatedQuestions as JSONValue[]}
        />
      )}
    </>
  )
}
