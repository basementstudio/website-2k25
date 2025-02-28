"use client"

import { useEffect, useMemo, useState } from "react"

import { useMedia } from "@/hooks/use-media"

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

export const ProjectList = ({ data }: { data: QueryType }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "rows">("grid")

  const isDesktop = useMedia("(min-width: 1024px)")

  // set view mode to grid on mobile
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

  const filteredProjects: FilteredProjectType[] = useMemo(() => {
    return selectedCategories.length === 0
      ? data.pages.showcase.projectList.items
      : data.pages.showcase.projectList.items.map((item) => ({
          ...item,
          disabled: !item.project?.categories?.some((cat) =>
            selectedCategories.includes(cat._title)
          )
        }))
  }, [data.pages.showcase.projectList.items, selectedCategories])

  return (
    <section className="flex flex-col gap-2">
      <Filters
        categories={categories}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {viewMode === "grid" ? (
        <Grid projects={filteredProjects} />
      ) : (
        <List projects={filteredProjects} />
      )}
    </section>
  )
}
