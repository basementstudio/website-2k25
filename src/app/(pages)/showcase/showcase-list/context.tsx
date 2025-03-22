"use client"

import { createContext, use, useEffect, useState } from "react"

interface ShowcaseContextType {
  viewMode: "grid" | "rows"
  setViewMode: (viewMode: "grid" | "rows") => void
}

export const ShowcaseContext = createContext<ShowcaseContextType>({
  viewMode: "grid",
  setViewMode: () => {}
})

export function ShowcaseProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<"grid" | "rows">("grid")

  useEffect(() => {
    // Initialize from URL hash on client-side only
    const hash = window.location.hash.slice(1)
    const initialMode = (hash === "grid" || hash === "rows") ? hash : "grid"
    setViewModeState(initialMode)

    // Set initial hash if none exists
    if (!window.location.hash) {
      window.location.hash = "grid"
    }

    // Listen for hash changes
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash === "grid" || hash === "rows") {
        setViewModeState(hash)
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const setViewMode = (mode: "grid" | "rows") => {
    window.location.hash = mode
    setViewModeState(mode)
  }

  return (
    <ShowcaseContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ShowcaseContext.Provider>
  )
}

export function useShowcaseContext() {
  const context = use(ShowcaseContext)

  if (!context)
    throw new Error("useShowcaseContext must be used within a ShowcaseProvider")

  return context
} 