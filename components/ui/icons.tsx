'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'

function IconLogo({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      {...props}
      className={cn(className)}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      >
        <path
          strokeLinejoin="round"
          d="M20 2s-2 4.688-2 8.571c0 1.244.426 2.284 1 3.32c.66 1.193 1.517 2.38 2.146 3.863c.499 1.178.854 2.543.854 4.246M4 2s2 4.688 2 8.571c0 1.244-.426 2.284-1 3.32c-.66 1.193-1.517 2.38-2.146 3.863A10.6 10.6 0 0 0 2 22"
        />
        <path d="M6 13h12m-6 9c.5-1.5 3-4.5 9-4.5M12 22c-.5-1.5-3-4.5-9-4.5" />
      </g>
    </svg>
  )
}

const Babe = () => (
  <Image
    // src="https://www.svgrepo.com/show/317641/national-female.svg"
    src="/images/ellie.svg"
    alt="National Female SVG File"
    width={0}
    height={0}
    className={cn('size-80')}
  />
)

export { IconLogo, Babe }
