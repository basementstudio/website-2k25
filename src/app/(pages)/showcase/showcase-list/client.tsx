"use client"

import { useSearchParams } from "next/navigation"
import { memo, useCallback, useMemo, useState } from "react"

import { Project } from "@/app/(pages)/showcase/basehub"
import { Filters } from "@/app/(pages)/showcase/filters"
import { Grid } from "@/app/(pages)/showcase/grid"
import { List } from "@/app/(pages)/showcase/list"
import { useMedia } from "@/hooks/use-media"
import { useShowcaseContext } from "./context"

export type CategoryItem = {
  name: string
  count: number
}

const ViewModeSelector = memo(
  ({
    viewMode,
    projects,
    isProjectDisabled
  }: {
    viewMode: "grid" | "rows"
    projects: Project[]
    isProjectDisabled: (project: Project) => boolean
  }) => {
    return viewMode === "grid" ? (
      <Grid projects={projects} isProjectDisabled={isProjectDisabled} />
    ) : (
      <List projects={projects} isProjectDisabled={isProjectDisabled} />
    )
  }
)
ViewModeSelector.displayName = "ViewModeSelector"

interface ShowcaseListClientProps {
  projects: Project[]
}

export const ShowcaseListClient = memo<ShowcaseListClientProps>(
  ({ projects }: ShowcaseListClientProps) => {
    const searchParams = useSearchParams()
    const isDesktop = useMedia("(min-width: 1024px)")
    const { viewMode, setViewMode } = useShowcaseContext()

    const [selectedCategory, setSelectedCategory] = useState<string | null>(
      searchParams.get("category") || null
    )

    const isProjectDisabled = useCallback(
      (project: Project) => {
        if (selectedCategory === null) return false
        return !project?.categories?.some(
          (category: { _title: string }) => selectedCategory === category._title
        )
      },
      [selectedCategory]
    )

    const categories = useMemo(() => {
      const categoryMap = new Map<string, number>()

      projects.forEach((project) => {
        project?.categories?.forEach((category: { _title: string }) => {
          if (category?._title) {
            categoryMap.set(
              category._title,
              (categoryMap.get(category._title) || 0) + 1
            )
          }
        })
      })

      return Array.from(categoryMap.entries())
        .map(
          ([name, count]): CategoryItem => ({
            name,
            count
          })
        )
        .sort((a, b) => b.count - a.count)
    }, [projects])

    const filteredProjects = useMemo(() => {
      return selectedCategory === null
        ? projects
        : projects.map((project) => ({
            ...project,
            disabled: !project?.categories?.some(
              (category: { _title: string }) => selectedCategory === category._title
            )
          }))
    }, [projects, selectedCategory])

    const handleSetSelectedCategory = useCallback((category: string | null) => {
      setSelectedCategory(category)
    }, [])

    const handleSetViewMode = useCallback(
      (mode: "grid" | "rows") => {
        if (!isDesktop) return
        setViewMode(mode)
      },
      [isDesktop, setViewMode]
    )

    return (
      <section className="flex flex-col gap-2" id="list">
        <Filters
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={handleSetSelectedCategory}
          viewMode={viewMode}
          setViewMode={handleSetViewMode}
        />

        <ViewModeSelector
          viewMode={viewMode}
          projects={filteredProjects}
          isProjectDisabled={isProjectDisabled}
        />
      </section>
    )
  }
)
ShowcaseListClient.displayName = "ShowcaseListClient"
