import { fetchCategoriesNonEmpty } from "@/app/(site)/(pages)/blog/basehub"

import { CategoriesClient } from "./client"

export const Categories = async () => {
  const categories = await fetchCategoriesNonEmpty()

  return <CategoriesClient categories={categories} />
}
