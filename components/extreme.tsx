'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Toggle } from './ui/toggle'
import { Icon } from '@/lib/icons'
import { Pro } from './babes'

export function ExtremeModeToggle() {
  const [isExtremeMode, setIsExtremeMode] = useState(true)

  // useEffect(() => {
  //   const savedMode = getCookie('search-mode')
  //   if (savedMode !== null) {
  //     setIsExtremeMode(savedMode === 'true')
  //   } else {
  //     setCookie('search-mode', 'true')
  //   }
  // }, [])

  const handleExtremeModeChange = (pressed: boolean) => {
    setIsExtremeMode(pressed)
    // setCookie('search-mode', pressed.toString())
  }

  return (
    <Toggle
      variant="outline"
      pressed={isExtremeMode}
      onPressedChange={handleExtremeModeChange}
      className={cn(
        'border border-rose-950/20 bg-background dark:bg-background/10',
        'data-[state=on]:bg-primary',
        'data-[state=on]:text-pink-100',
        'data-[state=on]:border-rose-950/50',
        'rounded-full group'
      )}
      aria-label="Toggle extreme mode"
    >
      <div className="flex item-center justify-center">
        <span className="-pt-1.5">Call</span> <Pro />
      </div>
    </Toggle>
  )
}
