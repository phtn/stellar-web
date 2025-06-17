import { useId } from 'react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { SwitchProps } from '@radix-ui/react-switch'

export default function VoiceToggle(props: SwitchProps) {
  const id = useId()
  return (
    <div
      className={cn(
        'relative flex w-full border border-sidebar-foreground/10 items-center rounded-full justify-between outline-none',
        'dark:bg-sidebar-accent/60 bg-input text-muted-foreground',
        {
          'dark:bg-sidebar-accent bg-teal-300 border-sidebar-foreground/10':
            props.checked
        }
      )}
    >
      <Label
        htmlFor={id}
        className={`
                flex items-center ps-4 rounded-full cursor-pointer transition-all duration-300
                ${props.checked ? 'text-primary' : 'text-muted-foreground'}
              `}
      >
        <div className="text-base font-medium tracking-snug font-space select-none">
          Voice {props.checked ? 'Enabled' : 'Disabled'}
        </div>
      </Label>

      <div className="relative flex h-9 w-12 items-center justify-end">
        <Switch
          id={id}
          {...props}
          icon="voice-solid"
          className="h-9 dark:bg-sidebar bg-sidebar"
          iconStyle={cn({ '': props.checked })}
          thumbStyle={cn({ 'dark:bg-background/50': props.checked })}
        />
      </div>
    </div>
  )
}
