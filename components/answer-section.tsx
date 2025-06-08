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
      setTimestamp(format(date, 'Pp'))
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
    console.log(audioUrl)
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }, [isPlaying, audioUrl])

  const onAudioEnded = () => setIsPlaying(false)
  const onAudioPlay = () => setIsPlaying(true)
  const onAudioPause = () => setIsPlaying(false)

  const VoicePlayback = useCallback(
    () => (
      <IconBtn
        btnProps={{
          onClick: handleVoicePlayback,
          'aria-label': isPlaying ? 'Pause voice' : 'Play voice'
        }}
        icon={audioStatus === 'playing' ? 'spinners-bars-middle' : 'tri'}
        solid
        iconStyle={cn(
          'text-indigo-500 dark:text-indigo-500 size-6 scale-50 transition-all duration-500',
          {
            'text-stone-400 size-2.5': isTTSPlaying,
            'scale-[10%] dark:text-indigo-400': audioStatus === 'receiving',
            'scale-[40%] dark:text-indigo-400': audioStatus === 'uploading',
            'scale-[60%] dark:text-cyan-500': audioStatus === 'uploaded',
            'scale-100 dark:text-teal-400': audioStatus === 'playable',
            'dark:text-indigo-400 size-6': audioStatus === 'playing'
          }
        )}
      />
    ),
    [handleVoicePlayback, isPlaying, isTTSPlaying, audioStatus]
  )

  const VoiceStatusIndicator = () => {
    switch (audioStatus) {
      case 'receiving':
        return (
          <span className="text-xs text-blue-300 scale">Generating...</span>
        )
      case 'uploading':
        return <span className="text-xs text-orange-300">Uploading...</span>
      case 'uploaded':
        return <span className="text-xs text-green-400">Uploaded</span>
      case 'playable':
        return <span className="text-xs text-green-500">Ready</span>
      case 'playing':
        return <span className="text-xs text-indigo-400">Playing</span>
      case 'error':
        return <span className="text-xs text-red-400">Audio Error</span>
      default:
        return null
    }
  }

  const message = content ? (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center space-x-2">
        <Avatar className="size-6 border -ml-6">
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
      <div className="p-4 border border-muted/20 dark:bg-sidebar bg-muted/80 rounded-2xl max-w-prose ">
        <AssistantMessage message={content} />
      </div>
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
      <div className="flex items-center space-x-6 justify-start">
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
