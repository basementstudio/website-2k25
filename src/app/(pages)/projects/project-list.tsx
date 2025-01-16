"use client"

import { useMemo, useState } from "react"

import { Filters } from "./filters"
import { Grid } from "./grid"
import { List } from "./list"
import { QueryType } from "./query"

export type FilteredProjectType =
  QueryType["pages"]["projects"]["projectList"]["items"][number] & {
    disabled?: boolean
  }

export type CategoryItem = {
  name: string
  count: number
}

export const ProjectList = ({ data }: { data: QueryType }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "rows">("grid")

  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>()

    data.pages.projects.projectList.items.forEach((item) => {
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
  }, [data.pages.projects.projectList.items])

  const filteredProjects: FilteredProjectType[] = useMemo(() => {
    return selectedCategories.length === 0
      ? data.pages.projects.projectList.items
      : data.pages.projects.projectList.items.map((item) => ({
          ...item,
          disabled: !item.project?.categories?.some((cat) =>
            selectedCategories.includes(cat._title)
          )
        }))
  }, [data.pages.projects.projectList.items, selectedCategories])

  return (
    <section className="flex flex-col gap-3">
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
