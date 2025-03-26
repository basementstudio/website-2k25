"use client"

import { createContext, use, useEffect, useState } from "react"

interface ProjectContextType {
  viewMode: "grid" | "rows" | undefined
  setViewMode: (viewMode: "grid" | "rows") => void
}

export const ProjectContext = createContext<ProjectContextType>({
  viewMode: undefined,
  setViewMode: () => {}
})

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<"grid" | "rows">("grid")

  const setViewMode = (mode: "grid" | "rows") => {
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
