"use client"

import { createContext, use, useEffect, useState } from "react"

interface ProjectContextType {
  viewMode: "grid" | "rows"
  setViewMode: (viewMode: "grid" | "rows") => void
}

export const ProjectContext = createContext<ProjectContextType>({
  viewMode: "grid",
  setViewMode: () => {}
})

export function ProjectProvider({ children }: { children: React.ReactNode }) {
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
    <ProjectContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = use(ProjectContext)

  if (!context)
    throw new Error("useProjectContext must be used within a ProjectProvider")

  return context
}
