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
  const [viewMode, setViewModeState] = useState<"grid" | "rows">("grid")

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash === "grid" || hash === "rows") {
      setViewModeState(hash)
    } else if (!window.location.hash) {
      window.location.hash = "grid"
    }

    const handleHashChange = () => {
      const newHash = window.location.hash.slice(1)
      if (newHash === "grid" || newHash === "rows") {
        setViewModeState(newHash)
      } else if (newHash === "") {
        setViewModeState("grid")
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
