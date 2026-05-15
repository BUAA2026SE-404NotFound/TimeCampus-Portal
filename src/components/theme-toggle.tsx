import * as React from "react"

import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"

function getResolvedTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function ThemeIcon() {
  return (
    <svg
      className="size-[18px]"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 3l0 18" />
      <path d="M12 9l4.65 -4.65" />
      <path d="M12 14.3l7.37 -7.37" />
      <path d="M12 19.6l8.85 -8.85" />
    </svg>
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [resolvedTheme, setResolvedTheme] = React.useState<"dark" | "light">(
    () => getResolvedTheme(),
  )

  React.useEffect(() => {
    const syncTheme = () => setResolvedTheme(getResolvedTheme())
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, {
      attributeFilter: ["class"],
      attributes: true,
    })

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
    mediaQuery.addEventListener("change", syncTheme)
    syncTheme()

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener("change", syncTheme)
    }
  }, [theme])

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      className={cn(
        "grid size-9 shrink-0 place-items-center border font-mono",
        isDark
          ? "border-white bg-white text-black hover:bg-white/85"
          : "border-white/30 bg-[#171717] text-white hover:bg-[#2a2a2a]",
      )}
      title={isDark ? "切换到浅色主题" : "切换到深色主题"}
      aria-label={isDark ? "切换到浅色主题" : "切换到深色主题"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <ThemeIcon />
    </button>
  )
}
