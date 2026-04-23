// ThemeProvider wrapping next-themes for Vite + React
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useEffect } from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider defaultTheme="system" attribute="class" enableSystem>
      {children}
    </NextThemesProvider>
  )
}
