"use client"

import { useLenis } from "lenis/react"
import { useSearchParams } from "next/navigation"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useMedia } from "@/hooks/use-media"
import { useWatchPathname } from "@/hooks/use-watch-pathname"

import { Filters } from "./filters"
import { Grid } from "./grid"
import { List } from "./list"
import { QueryType } from "./query"

export type FilteredProjectType =
  QueryType["pages"]["showcase"]["projectList"]["items"][number] & {
    disabled?: boolean
  }

export type CategoryItem = {
  name: string
  count: number
}

const ViewModeSelector = memo(
  ({
    viewMode,
    projects
  }: {
    viewMode: "grid" | "rows"
    projects: FilteredProjectType[]
  }) => {
    return viewMode === "grid" ? (
      <Grid projects={projects} />
    ) : (
      <List projects={projects} />
    )
  }
)
ViewModeSelector.displayName = "ViewModeSelector"

export const ProjectList = memo(({ data }: { data: QueryType }) => {
  const lenis = useLenis()
  const { currentPathname, prevPathname } = useWatchPathname()
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const searchParams = useSearchParams()
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("category")
      ? [decodeURIComponent(searchParams.get("category")!)]
      : []
  )
  const [viewMode, setViewMode] = useState<"grid" | "rows">("grid")

  useEffect(() => {
    if (currentPathname === "/showcase" && prevPathname.includes("/showcase")) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        lenis?.scrollTo("#projects", {
          immediate: true
        })
      }, 50)
    }

    return (): void => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [lenis, currentPathname, prevPathname])

  const isDesktop = useMedia("(min-width: 1024px)")

  useEffect(() => {
    if (!isDesktop) setViewMode("grid")
  }, [isDesktop])

  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>()

    data.pages.showcase.projectList.items.forEach((item) => {
      item?.project?.categories?.forEach((cat) => {
        if (cat._title) {
          categoryMap.set(cat._title, (categoryMap.get(cat._title) || 0) + 1)
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
  }, [data.pages.showcase.projectList.items])

  const filteredProjects = useMemo(() => {
    return selectedCategories.length === 0
      ? data.pages.showcase.projectList.items
      : data.pages.showcase.projectList.items.map((item) => ({
          ...item,
          disabled: !item.project?.categories?.some((cat) =>
            selectedCategories.includes(cat._title)
          )
        }))
  }, [data.pages.showcase.projectList.items, selectedCategories])

  const handleSetSelectedCategories = useCallback((categories: string[]) => {
    setSelectedCategories(categories)
  }, [])

  const handleSetViewMode = useCallback((mode: "grid" | "rows") => {
    setViewMode(mode)
  }, [])

  return (
    <section className="flex flex-col gap-2">
      <Filters
        categories={categories}
        selectedCategories={selectedCategories}
        setSelectedCategories={handleSetSelectedCategories}
        viewMode={viewMode}
        setViewMode={handleSetViewMode}
      />

      <ViewModeSelector viewMode={viewMode} projects={filteredProjects} />
    </section>
  )
})
ProjectList.displayName = "ProjectList"
