"use client"

import { useLenis } from "lenis/react"
import { useSearchParams } from "next/navigation"
import React, { useEffect, useState } from "react"

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
  const searchParams = useSearchParams()
  const lenis = useLenis()

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    if (searchParams.get("s")) lenis?.scrollTo("#blog", { immediate: true })
  }, [searchParams, lenis])

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
