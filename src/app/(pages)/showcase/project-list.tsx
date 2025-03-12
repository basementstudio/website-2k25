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
import { motion, useInView } from "motion/react"
import { variants } from "./motion"

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
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category") ?? null
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
    return selectedCategory === null
      ? data.pages.showcase.projectList.items
      : data.pages.showcase.projectList.items.map((item) => ({
          ...item,
          disabled: !item.project?.categories?.some(
            (cat) => selectedCategory === cat._title
          )
        }))
  }, [data.pages.showcase.projectList.items, selectedCategory])

  const handleSetSelectedCategory = useCallback((category: string | null) => {
    setSelectedCategory(category)
  }, [])

  const handleSetViewMode = useCallback((mode: "grid" | "rows") => {
    setViewMode(mode)
  }, [])

  return (
    <motion.section
      ref={ref}
      initial="inactive"
      animate={isInView ? "active" : "inactive"}
      variants={variants.main}
      className="flex scroll-m-4 flex-col gap-18 lg:gap-24"
    >
      <div className="grid-layout">
        <motion.h1
          variants={variants.item}
          className="col-span-3 text-mobile-h1 text-brand-w2 lg:col-start-1 lg:col-end-7 lg:text-h1"
        >
          Showcase
        </motion.h1>

        <motion.div
          variants={variants.item}
          className="col-span-1 text-mobile-h1 text-brand-g1 lg:col-start-7 lg:col-end-12 lg:text-h1"
        >
          {data.pages.showcase.projectList.items.length}
        </motion.div>
      </div>

      <div className="flex flex-col gap-2">
        <Filters
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={handleSetSelectedCategory}
          viewMode={viewMode}
          setViewMode={handleSetViewMode}
        />

        <ViewModeSelector viewMode={viewMode} projects={filteredProjects} />
      </div>
    </motion.section>
  )
})
ProjectList.displayName = "ProjectList"
