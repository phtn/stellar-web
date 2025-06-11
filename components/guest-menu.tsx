'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { IconBtn } from './icon-btn'
import { ThemeMenuItems } from './theme-menu-items'

export default function GuestMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-0">
        <IconBtn
          size={28}
          icon="settings-square"
          btnProps={{ asChild: true }}
          hoverStyle="dark:group-hover:text-sidebar group-hover:text-stone-600"
          iconStyle="size-7 group-hover:text-white dark:group-hover:text-stone-400"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        forceMount
        align="end"
        sideOffset={8}
        className="w-fit text-end mr-2 font-space dark:border-transparent bg-sidebar-accent border-sidebar-primary/30 dark:bg-sidebar-accent"
      >
        <ThemeMenuItems />
        {/* <DropdownMenuItem asChild>
          <Link href="/auth/login">
            <LogIn className="mr-2 size-4" />
            <span>Sign In</span>
          </Link>
        </DropdownMenuItem> */}
        {/* <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 size-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <ThemeMenuItems />
          </DropdownMenuSubContent>
        </DropdownMenuSub> */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
