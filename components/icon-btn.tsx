import type { ClassName } from '@/app/types'
import { Icon, type IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import type { ButtonProps } from './ui'

interface IconBtnProps {
  icon: IconName
  size?: number
  iconSize?: number
  solid?: boolean
  iconStyle?: ClassName
  shadowStyle?: ClassName
  hoverStyle?: ClassName
  withShadow?: boolean
  btnProps: ButtonProps
  animated?: boolean
}
export const IconBtn = ({
  icon,
  iconSize = 16,
  solid,
  size = 44,
  iconStyle,
  withShadow,
  shadowStyle,
  hoverStyle,
  animated = false,
  btnProps
}: IconBtnProps) => {
  const { asChild, ...restBtnProps } = btnProps
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp {...restBtnProps}>
      <span
        className={cn(
          'group relative size-11 aspect-square',
          'flex items-center justify-center'
        )}
      >
        {withShadow && (
          <Icon
            solid
            size={size}
            name="squircle"
            className={cn(
              'absolute z-0',
              'origin-center opacity-20',
              'pointer-events-none shrink-0 text-stone-400/80',
              {
                'dark:text-zinc-950/90 text-neutral-200 opacity-80':
                  !btnProps.disabled
              },
              'dark:text-zinc-950/40 dark:opacity-100',
              shadowStyle
            )}
          />
        )}
        <Icon
          solid
          size={size}
          name="squircle"
          className={cn(
            'absolute z-0',
            'origin-center scale-0 opacity-20',
            'transition-all will-change-transform duration-300 ease-in-out',
            'group-hover:scale-100 group-hover:opacity-100',
            'pointer-events-none shrink-0',
            // LIGHT
            'text-white/5',
            'group-hover:text-zinc-300/60',
            // DARK
            'dark:group-hover:text-zinc-950/40',
            {
              'group-hover:text-zinc-950/90': withShadow && !btnProps.disabled
            },
            hoverStyle
          )}
        />
        <Icon
          size={iconSize}
          name={icon}
          solid={solid}
          className={cn(
            'relative z-10',
            // LIGHT
            'text-neutral-700',
            'group-hover:text-sky-300',
            // DARK
            'dark:text-sidebar-accent-foreground/70',
            'transition-all duration-300',

            {
              'dark:group-hover:text-orange-300/70':
                withShadow && btnProps.disabled,
              'group-hover:-translate-y-1': animated && !btnProps.disabled,
              'group-hover:text-cyan-100': withShadow && !btnProps.disabled,
              'text-neutral-400 group-hover:text-neutral-500':
                btnProps.disabled,
              'text-neutral-700 group-hover:text-sky-300/90': !btnProps.disabled
            },

            iconStyle
          )}
        />
      </span>
    </Comp>
  )
}
