'use client'

import { cn } from '@/lib/utils'
import { getCookie, setCookie } from '@/lib/utils/cookies'
import { Globe, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Toggle } from './ui/toggle'

export function SearchModeToggle() {
  const [isSearchMode, setIsSearchMode] = useState(true)

  useEffect(() => {
    const savedMode = getCookie('search-mode')
    if (savedMode !== null) {
      setIsSearchMode(savedMode === 'true')
    } else {
      setCookie('search-mode', 'true')
    }
  }, [])

  const handleSearchModeChange = (pressed: boolean) => {
    setIsSearchMode(pressed)
    setCookie('search-mode', pressed.toString())
  }

  return (
    <Toggle
      aria-label="Toggle search mode"
      pressed={isSearchMode}
      onPressedChange={handleSearchModeChange}
      variant="outline"
      className={cn(
        'gap-1 px-3 border border-input text-muted-foreground bg-background',
        'data-[state=on]:bg-primary',
        'data-[state=on]:text-destructive-foreground',
        'data-[state=on]:border-destructive-border',
        'hover:bg-destructive hover:text-destructive-foreground rounded-full'
      )}
    >
      <div className="flex item-center justify-center -space-x-2.5">
        <XIcon className="opacity-40 size-3 scale-75" />
        <XIcon className="size-5 stroke-2 text-rose-500" />
        <XIcon className="opacity-40 size-2 scale-75" />
      </div>
      <span className="text-xs">Extreme</span>
    </Toggle>
  )
}
