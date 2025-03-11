import { Suspense } from "react"

import { BlogList } from "@/components/blog/list"

import { fetchCategoriesNonEmpty } from "../basehub"

export const experimental_ppr = true

type Params = Promise<{ slug: string[] }>

const BlogIndexPage = async (props: { params: Params }) => {
  const params = await props.params

  return (
    <Suspense fallback={null}>
      <BlogList params={params} />
    </Suspense>
  )
}

// pre build all the categories
export const generateStaticParams = async () => {
  const categories = await fetchCategoriesNonEmpty()

  categories.unshift({
    _title: "Home",
    _slug: ""
  })

  return categories.map((category) => ({
    slug: [category._slug]
  }))
}

export default BlogIndexPage
