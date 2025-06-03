import { Icon } from '@/lib/icons'
import { ChatRequestOptions } from 'ai'
import { CollapsibleMessage } from './collapsible-message'
import { DefaultSkeleton } from './default-skeleton'
import { BotMessage } from './message'
import { MessageActions } from './message-actions'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export type AnswerSectionProps = {
  content: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  chatId?: string
  showActions?: boolean
  messageId: string
  reload?: (
    messageId: string,
    options?: ChatRequestOptions
  ) => Promise<string | null | undefined>
  isTTSPlaying?: boolean
}

export function AnswerSection({
  content,
  isOpen,
  onOpenChange,
  chatId,
  showActions = true, // Default to true for backward compatibility
  messageId,
  reload,
  isTTSPlaying
}: AnswerSectionProps) {
  const enableShare = process.env.NEXT_PUBLIC_ENABLE_SHARE === 'true'

  const [timestamp, setTimestamp] = useState<string | null>(null)

  useEffect(() => {
    if (content) {
      const date = new Date()
      setTimestamp(format(date, 'Pp'))
    }
  }, [content])

  const handleReload = () => {
    if (reload) {
      return reload(messageId)
    }
    return Promise.resolve(undefined)
  }

  const VoicePlayback = () => (
    <Icon
      name={isTTSPlaying ? 'spinners-bars-middle' : 'ai-voice'}
      className={cn('text-indigo-500 dark:text-indigo-400 size-5', {
        'text-stone-400 size-2.5': isTTSPlaying
      })}
      solid
    />
  )

  const message = content ? (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center space-x-3">
        <Avatar className="size-6">
          {false && <AvatarImage src={''} alt={''} />}
          <AvatarFallback className="dark:bg-background/50">
            <Icon
              size={14}
              name="asterisk"
              className="text-pink-400 dark:text-pink-200/60"
            />
          </AvatarFallback>
        </Avatar>
        <VoicePlayback />
      </div>
      <div className="pt-2 px-2">
        <BotMessage message={content} />
      </div>
      <div className="flex items-end justify-between">
        <div className="ps-2 font-space text-sm opacity-50">{timestamp}</div>
        {showActions && (
          <MessageActions
            chatId={chatId}
            message={content} // Keep original message content for copy
            reload={handleReload}
            messageId={messageId}
            enableShare={enableShare}
          />
        )}
      </div>
    </div>
  ) : (
    <DefaultSkeleton />
  )
  return (
    <CollapsibleMessage
      isOpen={isOpen}
      showIcon={false}
      showBorder={false}
      role={'assistant'}
      isCollapsible={false}
      onOpenChange={onOpenChange}
    >
      {message}
    </CollapsibleMessage>
  )
}
