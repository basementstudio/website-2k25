"use client"

import { useState } from "react"

import { ProjectGallery } from "./gallery"
import { ProjectInfo } from "./info"
import { QueryItemType } from "./query"

export function ProjectWrapper({ entry }: { entry: QueryItemType }) {
  const [viewMode, setViewMode] = useState<"grid" | "rows">("grid")

  console.log(viewMode)

  return (
    <div className="grid-layout min-h-screen">
      <ProjectGallery entry={entry} viewMode={viewMode} />
      <ProjectInfo
        entry={entry}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    </div>
  )
}
