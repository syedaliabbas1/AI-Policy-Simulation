import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export interface SiteHeaderProps {
  title?: string
  scenario?: React.ReactNode
  actions?: React.ReactNode
}

export function SiteHeader({ title, scenario, actions }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        {title && <h1 className="text-base font-medium">{title}</h1>}
        {scenario && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            {scenario}
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {actions}
        </div>
      </div>
    </header>
  )
}
