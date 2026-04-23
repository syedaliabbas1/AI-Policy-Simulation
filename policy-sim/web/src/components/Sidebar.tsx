"use client"
// Fixed left sidebar (lg+) + sticky top bar (xs-lg)
import { DarkModeToggle } from "./DarkModeToggle"
import {
  RiBarChartBoxLine,
  RiFileList3Line,
  RiHome5Line,
  RiMenuLine,
  RiSettings4Line,
} from "@remixicon/react"
import { cx } from "../lib/tremor/cx"
import { focusRing } from "../lib/tremor/focusRing"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./tremor/Drawer"

const NAV_ITEMS = [
  { id: "simulation",    label: "Simulation",     icon: RiHome5Line },
  { id: "archetypes",    label: "Archetypes",       icon: RiBarChartBoxLine },
  { id: "ifs-validation", label: "IFS Validation", icon: RiFileList3Line },
] as const

const SHORTCUTS = [
  { id: "reports",  label: "Reports",  icon: RiFileList3Line },
  { id: "settings", label: "Settings",  icon: RiSettings4Line },
] as const

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <>
      {/* ── Desktop sidebar (lg+) ─────────────────────── */}
      <nav
        aria-label="main navigation"
        className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col"
      >
        <aside className="flex grow flex-col overflow-y-auto border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#090E1A]">
          {/* Brand */}
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-blue-500">
              <span className="text-sm font-semibold text-white">PS</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Policy Sim</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">UK Fiscal Analysis</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex flex-1 flex-col space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cx(
                  activeView === item.id
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50",
                  "flex items-center gap-x-2.5 rounded-md px-2 py-2 text-sm font-medium transition",
                  focusRing,
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Shortcuts */}
          <div className="mt-6">
            <span className="mb-2 block px-2 text-xs font-medium text-gray-500 dark:text-gray-500">
              Shortcuts
            </span>
            <nav className="space-y-0.5">
              {SHORTCUTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={cx(
                    "flex w-full items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50",
                    focusRing,
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Bottom: dark mode toggle */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-500">policy-sim v1.0</span>
            <DarkModeToggle className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50" />
          </div>
        </aside>
      </nav>

      {/* ── Mobile top bar (xs-lg) ─────────────────────── */}
      <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 shadow-sm dark:border-gray-800 dark:bg-[#090E1A] lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-blue-500">
            <span className="text-xs font-semibold text-white">PS</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">Policy Sim</span>
        </div>
        <div className="flex items-center gap-1">
          <DarkModeToggle className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" />
          <MobileDrawer activeView={activeView} onViewChange={onViewChange} />
        </div>
      </div>
    </>
  )
}

function MobileDrawer({ activeView, onViewChange }: SidebarProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          aria-label="Open menu"
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <RiMenuLine className="size-5" aria-hidden="true" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Policy Sim</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <nav className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => (
              <DrawerClose key={item.id} asChild>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={cx(
                    activeView === item.id
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
                    "flex items-center gap-x-2.5 rounded-md px-3 py-2 text-sm font-medium text-left transition",
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </button>
              </DrawerClose>
            ))}
          </nav>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
