"use client"

import { useSearchParams } from "next/navigation"
import { memo, useCallback, useEffect, useMemo, useState } from "react"

import { Filters } from "@/app/(site)/(canvas)/(content)/showcase/filters"
import { Grid } from "@/app/(site)/(canvas)/(content)/showcase/grid"
import { List } from "@/app/(site)/(canvas)/(content)/showcase/list"
import type { ShowcaseProject } from "@/app/(site)/(canvas)/(content)/showcase/sanity"
import { useMedia } from "@/hooks/use-media"

export type CategoryItem = {
  name: string
  count: number
}

const ViewModeSelector = memo(
  ({
    viewMode,
    projects,
    disabledSlugs
  }: {
    viewMode: "grid" | "rows"
    projects: ShowcaseProject[]
    disabledSlugs: Set<string> | null
  }) => {
    return viewMode === "grid" ? (
      <Grid projects={projects} disabledSlugs={disabledSlugs} />
    ) : (
      <List projects={projects} disabledSlugs={disabledSlugs} />
    )
  }
)
ViewModeSelector.displayName = "ViewModeSelector"

interface ShowcaseListClientProps {
  projects: ShowcaseProject[]
}

export const ShowcaseListClient = memo<ShowcaseListClientProps>(
  ({ projects }: ShowcaseListClientProps) => {
    const searchParams = useSearchParams()
    const isDesktop = useMedia("(min-width: 1024px)")

    const getStoredPreference = () => {
      if (typeof window === "undefined") return "grid"
      const stored = localStorage.getItem("showcase-view-mode")
      return stored === "rows" || stored === "grid" ? stored : "grid"
    }

    const [viewMode, setViewMode] = useState<"grid" | "rows">(
      getStoredPreference()
    )

    useEffect(() => {
      if (!isDesktop) {
        setViewMode("grid")
      } else {
        const stored = getStoredPreference()
        setViewMode(stored)
      }
    }, [isDesktop])

    const [selectedCategory, setSelectedCategory] = useState<string | null>(
      searchParams.get("category") || null
    )

    const disabledSlugs = useMemo(() => {
      if (selectedCategory === null) return null
      return new Set(
        projects
          .filter(
            (project) =>
              !project?.categories?.some(
                (category) => selectedCategory === category.title
              )
          )
          .map((project) => project.slug)
      )
    }, [projects, selectedCategory])

    const categories = useMemo(() => {
      const categoryMap = new Map<string, number>()

      projects.forEach((project) => {
        project?.categories?.forEach((category) => {
          if (category?.title) {
            categoryMap.set(
              category.title,
              (categoryMap.get(category.title) || 0) + 1
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

    const handleSetSelectedCategory = useCallback((category: string | null) => {
      setSelectedCategory(category)
    }, [])

    const handleSetViewMode = useCallback(
      (mode: "grid" | "rows") => {
        if (!isDesktop) return

        setViewMode(mode)
        localStorage.setItem("showcase-view-mode", mode)
      },
      [isDesktop]
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
          projects={projects}
          disabledSlugs={disabledSlugs}
        />
      </section>
    )
  }
)
ShowcaseListClient.displayName = "ShowcaseListClient"
