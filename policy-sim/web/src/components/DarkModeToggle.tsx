// Dark mode toggle using next-themes
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { RiMoonFill, RiSunFill } from "@remixicon/react"

export function DarkModeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return <div className={`size-8 ${className ?? ""}`} />
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={className}
      aria-label="Toggle dark mode"
    >
      {resolvedTheme === "dark" ? (
        <RiSunFill className="size-4" aria-hidden="true" />
      ) : (
        <RiMoonFill className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
