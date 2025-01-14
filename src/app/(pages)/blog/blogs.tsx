"use client"

import React, { useState } from "react"

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

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
