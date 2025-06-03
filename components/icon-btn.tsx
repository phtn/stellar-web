import type { ClassName } from '@/app/types'
import { Icon, type IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { ButtonProps } from './ui'

interface IconBtnProps {
  icon: IconName
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
  solid,
  iconStyle,
  withShadow,
  shadowStyle,
  hoverStyle,
  animated = false,
  btnProps
}: IconBtnProps) => {
  return (
    <button
      {...btnProps}
      className={cn(
        'group relative size-11 aspect-square',
        'flex items-center justify-center'
      )}
    >
      {withShadow && (
        <Icon
          solid
          size={44}
          name="squircle"
          className={cn(
            'absolute z-0',
            'origin-center opacity-10',
            'pointer-events-none shrink-0 text-stone-400/80',
            {
              'dark:text-zinc-950/60 text-neutral-200 opacity-80':
                !btnProps.disabled
            },
            shadowStyle
          )}
        />
      )}
      <Icon
        solid
        size={44}
        name="squircle"
        className={cn(
          'absolute z-0',
          'origin-center scale-0 opacity-20',
          'transition-all will-change-transform duration-300',
          'group-hover:scale-100 group-hover:opacity-100',
          'pointer-events-none shrink-0',
          // LIGHT
          'text-white/5',
          'group-hover:text-stone-200/50',
          // DARK
          'dark:group-hover:text-zinc-950/40',
          { 'group-hover:text-zinc-950/90': withShadow && !btnProps.disabled },
          hoverStyle
        )}
      />
      <Icon
        size={16}
        name={icon}
        solid={solid}
        className={cn(
          'relative z-10',
          // LIGHT
          'text-neutral-500',
          'group-hover:text-cyan-600',
          // DARK
          'dark:text-cyan-100/60 ',
          'transition-all duration-300',
          'group-disabled:text-neutral-500',
          {
            'dark:group-hover:text-orange-300/70':
              withShadow && btnProps.disabled,
            'group-hover:-translate-y-1': animated && !btnProps.disabled,
            'group-hover:text-cyan-100': withShadow && !btnProps.disabled
          },

          iconStyle
        )}
      />
    </button>
  )
}
