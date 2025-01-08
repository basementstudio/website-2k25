"use client"

import React, { useMemo, useState } from "react"

import { QueryType } from "./query"

interface BlogChildProps {
  data: QueryType
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  categories: string[]
}

export default function BlogPosts({
  children,
  data
}: {
  children: React.ReactNode
  data: QueryType
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        data.pages.blog.posts.items.flatMap((post) =>
          post.categories?.map((cat) => cat._title)
        )
      )
    ).filter((c): c is string => c !== undefined)
  }, [data.pages.blog.posts.items])

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        selectedCategories,
        setSelectedCategories,
        categories,
        data
      } as BlogChildProps)
    }
    return child
  })

  return <>{childrenWithProps}</>
}
