"use client"

import { createContext, use, useState, useEffect } from "react"

interface ProjectContextType {
  viewMode: "grid" | "rows" | undefined
  setViewMode: (viewMode: "grid" | "rows") => void
}

export const ProjectContext = createContext<ProjectContextType>({
  viewMode: undefined,
  setViewMode: () => {}
})

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<"grid" | "rows">()

  useEffect(() => {
    const stored = localStorage.getItem("project-gallery-view-mode")
    if (stored === "rows" || stored === "grid") {
      setViewModeState(stored)
    } else {
      setViewModeState("grid")
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
