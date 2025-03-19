"use client"

import { createContext, use, useState, useEffect } from "react"

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
    const stored = localStorage.getItem("project-gallery-view-mode")
    if (stored === "rows" || stored === "grid") {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches

      if (isDesktop) {
        setViewModeState(stored)
      }
    }
  }, [])

  const setViewMode = (mode: "grid" | "rows") => {
    setViewModeState(mode)
    localStorage.setItem("project-gallery-view-mode", mode)
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
