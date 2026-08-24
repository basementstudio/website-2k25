import type { ShowcaseProject } from "./sanity"

export type CategoryItem = {
  name: string
  count: number
}

// Shared by the client list and the prerendered fallback — the two must derive
// the same categories in the same order or hydration shifts the filters bar.
export const deriveCategories = (
  projects: ShowcaseProject[]
): CategoryItem[] => {
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
    .map(([name, count]): CategoryItem => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}
