"use client"

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <a
                href={item.url}
                title={item.title}
                data-active={item.isActive ? "" : undefined}
                className="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-4xl border border-transparent bg-clip-padding px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground data-[active]:bg-muted data-[active]:text-foreground dark:hover:bg-muted/50 dark:aria-expanded:bg-muted/50"
              >
                {item.icon}
                <span>{item.title}</span>
              </a>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
