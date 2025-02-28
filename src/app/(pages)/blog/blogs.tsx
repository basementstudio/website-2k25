"use client"

import { useLenis } from "lenis/react"
import React, { useEffect, useState } from "react"

import { useWatchPathname } from "@/hooks/use-watch-pathname"

import { QueryType } from "./query"

interface BlogChildProps {
  data: QueryType
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  categories: string[]
}

export default function BlogPosts({
  children,
  data,
  categories
}: {
  children: React.ReactNode
  data: QueryType
  categories: string[]
}) {
  const lenis = useLenis()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const { currentPathname, prevPathname } = useWatchPathname()

  useEffect(() => {
    if (currentPathname === "/blog" && prevPathname.includes("/blog"))
      lenis?.scrollTo("#blog", { immediate: true })
  }, [lenis, currentPathname, prevPathname])

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        selectedCategories,
        setSelectedCategories,
        categories: categories,
        data
      } as BlogChildProps)
    }
    return child
  })

  return <>{childrenWithProps}</>
}
