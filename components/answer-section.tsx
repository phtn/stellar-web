import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ChatRequestOptions } from 'ai'
import { format } from 'date-fns'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CollapsibleMessage } from './collapsible-message'
import { DefaultSkeleton } from './default-skeleton'
import { IconBtn } from './icon-btn'
import { AssistantMessage } from './message'
import { MessageActions } from './message-actions'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

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
  audioUrl?: string
  audioStatus?: string
}

export function AnswerSection({
  content,
  isOpen,
  onOpenChange,
  chatId,
  showActions = true, // Default to true for backward compatibility
  messageId,
  reload,
  isTTSPlaying,
  audioUrl,
  audioStatus
}: AnswerSectionProps) {
  const enableShare = process.env.NEXT_PUBLIC_ENABLE_SHARE === 'true'

  const [timestamp, setTimestamp] = useState<string | null>(null)

  useEffect(() => {
    if (content) {
      const date = new Date()
      setTimestamp(format(date, 'p'))
    }
  }, [content])

  const handleReload = () => {
    if (reload) {
      return reload(messageId)
    }
    return Promise.resolve(undefined)
  }

  // Voice playback logic
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleVoicePlayback = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }, [isPlaying])

  const onAudioEnded = () => setIsPlaying(false)
  const onAudioPlay = () => setIsPlaying(true)
  const onAudioPause = () => setIsPlaying(false)

  const VoicePlayback = useCallback(
    () => (
      <IconBtn
        solid
        size={28}
        btnProps={{
          onClick: handleVoicePlayback,
          'aria-label': isPlaying ? 'Pause voice' : 'Play voice'
        }}
        hoverStyle="group-hover:text-zinc-100/40"
        icon={
          audioStatus === 'playable'
            ? 'tri'
            : audioStatus === 'playing'
              ? 'spinners-bars-middle'
              : 'spinners-3-dots-move'
        }
        iconStyle={cn(
          'text-indigo-500 group-hover:text-teal-500 dark:text-indigo-500 size-6',
          {
            'text-stone-400 size-2.5': isTTSPlaying,
            'size-2.5 dark:text-indigo-300': audioStatus === 'receiving',
            'size-2.5 dark:text-orange-200': audioStatus === 'uploading',
            'size-2.5 dark:text-cyan-500': audioStatus === 'uploaded',
            'dark:text-teal-400 size-3.5': audioStatus === 'playable',
            'dark:text-indigo-400 size-4': audioStatus === 'playing'
          }
        )}
      />
    ),
    [handleVoicePlayback, isPlaying, isTTSPlaying, audioStatus]
  )

  const message = content ? (
    <div className="flex flex-col pe-16">
      <div className="flex flex-row items-center">
        <Avatar className="size-6 -ml-6">
          {false && <AvatarImage src={''} alt={''} />}
          <AvatarFallback className="dark:bg-background/50 relative">
            <Icon
              size={14}
              name="sparkle"
              className="text-pink-400 dark:text-pink-300"
            />
          </AvatarFallback>
        </Avatar>
        <VoicePlayback />
        {/* <VoiceStatusIndicator /> */}
      </div>
      <div className="p-6 border border-muted/20 dark:bg-sidebar bg-muted/80 rounded-2xl max-w-prose ">
        <AssistantMessage message={content} />
      </div>

      <div className="flex items-center space-x-6 justify-end">
        <div className="ps-2 font-space tracking-wider text-xs opacity-50">
          {timestamp}
        </div>
        {showActions && (
          <MessageActions
            chatId={chatId}
            message={content} // Keep original message content for copy
            reload={handleReload}
            messageId={messageId}
            enableShare={enableShare}
          />
        )}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            style={{ display: 'none' }}
            onEnded={onAudioEnded}
            onPlay={onAudioPlay}
            onPause={onAudioPause}
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
