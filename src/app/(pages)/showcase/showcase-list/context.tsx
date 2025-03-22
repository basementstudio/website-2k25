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
  const [viewMode, setViewModeState] = useState<"grid" | "rows">(() => {
    if (typeof window === "undefined") return "grid"
    const hash = window.location.hash.slice(1)
    return (hash === "grid" || hash === "rows") ? hash : "grid"
  })

  useEffect(() => {
    // Only set #grid if no hash is present
    if (typeof window !== "undefined" && !window.location.hash) {
      window.location.hash = "grid"
    }
  }, [])

  const setViewMode = (mode: "grid" | "rows") => {
    window.location.hash = mode
    setViewModeState(mode)
  }

  useEffect(() => {
    const handleHashChange = () => {
      const newMode = (window.location.hash.slice(1) as "grid" | "rows") || "grid"
      setViewModeState(newMode)
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

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