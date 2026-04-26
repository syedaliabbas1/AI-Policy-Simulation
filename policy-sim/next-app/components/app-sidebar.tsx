"use client"

import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  IconDashboard,
  IconPlayerPlay,
  IconChartBar,
  IconChecklist,
  IconSettings,
  IconHelp,
  IconSearch,
  IconDatabase,
  IconReport,
  IconMessageChatbot,
  IconInnerShadowTop,
} from "@tabler/icons-react"

const data = {
  user: {
    name: "Policy Sim",
    email: "poligent.systems",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Simulation",
      url: "/simulation",
      icon: <IconPlayerPlay />,
      isActive: true,
    },
    {
      title: "Compare",
      url: "/compare",
      icon: <IconChartBar />,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <IconDashboard />,
    },
    {
      title: "IFS Check",
      url: "/ifs",
      icon: <IconChecklist />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: <IconSettings />,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: <IconHelp />,
    },
    {
      title: "Search",
      url: "/search",
      icon: <IconSearch />,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "/library",
      icon: <IconDatabase />,
    },
    {
      name: "Reports",
      url: "/reports",
      icon: <IconReport />,
    },
    {
      name: "Policy Assistant",
      url: "/assistant",
      icon: <IconMessageChatbot />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/simulation" />}
            >
              <IconInnerShadowTop className="size-5!" />
              <span className="text-base font-semibold">Poligent</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
