"use client"

import { createContext, use, useState } from "react"

interface ProjectContextType {
  viewMode: "grid" | "rows"
  setViewMode: (viewMode: "grid" | "rows") => void
}

export const ProjectContext = createContext<ProjectContextType>({
  viewMode: "grid",
  setViewMode: () => {}
})

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<"grid" | "rows">("grid")

  return (
    <ProjectContext value={{ viewMode, setViewMode }}>
      {children}
    </ProjectContext>
  )
}

export function useProjectContext() {
  const context = use(ProjectContext)

  if (!context)
    throw new Error("useProjectContext must be used within a ProjectProvider")

  return context
}
