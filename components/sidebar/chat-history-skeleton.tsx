import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton
} from '@/components/ui/sidebar'

export function ChatHistorySkeleton() {
  return (
    <SidebarMenu>
      {Array.from({ length: 3 }).map((_, idx) => (
        <SidebarMenuItem key={idx} className="h-12">
          <SidebarMenuSkeleton showIcon={false} />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
