'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function ThemeMenuItems() {
  const { setTheme, themes } = useTheme()
  const handleSet = useCallback(
    (theme: Theme) => () => {
      setTheme(theme)
    },
    [setTheme]
  )

  // const themes = useMemo(() => ['light', 'dark', 'system'], [])

  return (
    <>
      {themes.map(theme => (
        <DropdownMenuItem
          key={theme}
          onClick={handleSet(theme as Theme)}
          className="h-10 cursor-pointer rounded-xl dark:hover:bg-sidebar hover:bg-stone-200/50 px-4"
        >
          <span>{theme}</span>
        </DropdownMenuItem>
      ))}
    </>
  )
}
