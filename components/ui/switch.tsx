'use client'

import { Switch as SwitchPrimitive, SwitchThumb } from '@radix-ui/react-switch'

import { cn } from '@/lib/utils/index'
import { ComponentProps } from 'react'
import { Icon } from '@/lib/icons'

function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive>) {
  return (
    <SwitchPrimitive
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary/10 data-[state=unchecked]:bg-sidebar-foreground/20 focus-visible:ring-teal-500/50 inline-flex h-6 w-14 shrink-0 items-center rounded-full border-2 border-transparent transition-all outline-none focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchThumb
        data-slot="switch-thumb"
        className={cn(
          'data-[state=checked]:bg-teal-100 pointer-events-none shadow-sm border data-[state=unchecked]:border-muted-foreground data-[state=checked]:border-primary dark:border-transparent flex ml-1 items-center justify-center max-h-[1.75rem] aspect-square overflow-hidden transition-all duration rounded-full shadow-xs ring-0 data-[state=checked]:translate-x-4 data-[state=unchecked]:-translate-x-0 data-[state=checked]:rtl:-translate-x-4'
        )}
      >
        <Icon
          solid
          strokeWidth={3}
          size={24}
          name="voice-solid"
          className={cn(
            'data-[state-checked]:text-teal-400 flex-grow shrink-0',
            { 'dark:text-teal-400 text-primary': props.checked }
          )}
        />
      </SwitchThumb>
    </SwitchPrimitive>
  )
}

export { Switch }
