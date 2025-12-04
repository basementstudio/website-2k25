import { BlogList } from "@/components/blog/list"

import { fetchCategoriesNonEmpty } from "../basehub"

type Params = Promise<{ slug: string[] }>

const BlogIndexPage = async (props: { params: Params }) => {
  const params = await props.params

  return <BlogList params={params} />
}

// pre build all the categories
export const generateStaticParams = async () => {
  const categories = await fetchCategoriesNonEmpty()

  categories.unshift({
    _title: "Home",
    _slug: ""
  })

  return categories.map((category) => ({
    slug: [(category as { _slug: string })._slug ?? ""]
  }))
}

export default BlogIndexPage
