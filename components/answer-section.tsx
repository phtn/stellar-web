'use client'

import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { CollapsibleMessage } from './collapsible-message'
import { DefaultSkeleton } from './default-skeleton'
import { IconBtn } from './icon-btn'
import { AssistantMessage } from './message'
import { MessageActions } from './message-actions'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { AudioStatus } from '@/lib/hooks/use-audio-playback'
import { useVoiceCtx } from '@/ctx/voice'

export type AnswerSectionProps = {
  content: string
  onOpenChange: (open: boolean) => void
  chatId?: string
  showActions?: boolean
  messageId: string
  audioUrl?: string
  audioStatus?: AudioStatus
}

export function AnswerSection({
  chatId,
  content,
  audioUrl,
  messageId,
  showActions, // Default to true for backward compatibility
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

  const {
    voiceState,
    playback,
    audioRef,
    onAudioPlay,
    onAudioEnded,
    onAudioPause
  } = useVoiceCtx()

  // Voice playback logic
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
        {voiceState && (
          <VoicePlayback
            playFn={playback}
            audioStatus={audioStatus}
            isPlaying={audioStatus === 'playing'}
          />
        )}
        {/* <span>{audioStatus}</span> */}
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
      showIcon={false}
      showBorder={false}
      role={'assistant'}
      isCollapsible={false}
    >
      {message}
    </CollapsibleMessage>
  )
}

interface VoicePlaybackProps {
  playFn: VoidFunction
  isPlaying: boolean
  audioStatus?: AudioStatus
}
const VoicePlayback = ({
  playFn,
  isPlaying,
  audioStatus
}: VoicePlaybackProps) => (
  <IconBtn
    solid
    size={28}
    btnProps={{
      onClick: playFn,
      'aria-label': isPlaying ? 'Pause voice' : 'Play voice'
    }}
    hoverStyle="group-hover:text-zinc-100/40"
    icon={
      audioStatus === 'playable'
        ? 'tri'
        : audioStatus === 'playing'
          ? 'spinners-bars-middle'
          : audioStatus === 'error'
            ? 'refresh'
            : 'spinners-3-dots-move'
    }
    iconStyle={cn(
      'text-indigo-500 group-hover:text-teal-500 dark:text-indigo-500 size-4',
      {
        'text-rose-500 size-5': audioStatus === 'error',
        'dark:text-indigo-300': audioStatus === 'receiving',
        'dark:text-orange-200 text-orange-300': audioStatus === 'uploading',
        'dark:text-cyan-300 text-cyan-500': audioStatus === 'uploaded',
        'dark:text-teal-400 text-teal-500 size-5': audioStatus === 'playable',
        'dark:text-indigo-300 size-4': audioStatus === 'playing'
      }
    )}
  />
)
