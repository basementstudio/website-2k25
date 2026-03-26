import { BlogList } from "@/components/blog/list"

import { fetchCategoriesNonEmpty } from "../sanity"

type Params = Promise<{ slug: string[] }>

export const experimental_ppr = true

const BlogIndexPage = async (props: { params: Params }) => {
  const params = await props.params

  return <BlogList params={params} />
}

// pre build all the categories
export const generateStaticParams = async () => {
  const categories = await fetchCategoriesNonEmpty()

  categories.unshift({
    title: "Home",
    slug: ""
  })

  return categories.map((category) => ({
    slug: [category.slug]
  }))
}

export default BlogIndexPage
