import { useCallback } from 'react'
import { Button } from './ui/button'
import { Icon } from '@/lib/icons'

interface RetryButtonProps {
  reload: () => Promise<string | null | undefined>
  messageId: string
}

export const RetryButton = ({ reload, messageId }: RetryButtonProps) => {
  const handleReload = useCallback(() => {
    reload()
  }, [reload])

  return (
    <Button
      size="icon"
      type="button"
      variant="ghost"
      onClick={handleReload}
      className="rounded-full"
      aria-label={`Retry from message ${messageId}`}
    >
      <Icon
        name="refresh"
        className="size-4 dark:text-sidebar-foreground text-stone-700"
      />
      <span className="sr-only">Retry</span>
    </Button>
  )
}
