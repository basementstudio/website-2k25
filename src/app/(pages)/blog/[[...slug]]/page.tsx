import { Categories } from "@/components/blog/categories"
import { BlogList } from "@/components/blog/list"

import { fetchCategoriesNonEmpty, fetchPosts } from "../basehub"
import { Featured } from "../featured"
import { Hero } from "../hero"

type Params = Promise<{ slug: string[] }>

const BlogIndexPage = async (props: { params: Params }) => {
  const params = await props.params
  const posts = await fetchPosts(params.slug ? params.slug[0] : undefined)

  return (
    <>
      <div id="blog" className="-translate-y-[36px]" />
      <div className="pb-25 relative flex flex-col gap-18 bg-brand-k lg:gap-40">
        <Hero />
        <Featured />
        <div className="col-span-full grid w-full grid-cols-12 gap-x-2 border-brand-w1/20 lg:col-start-1">
          <div className="col-span-full grid grid-cols-12 items-end gap-2 border-b border-brand-w1/20 pb-2">
            <h2 className="col-span-full text-mobile-h3 text-brand-g1 lg:col-span-3 lg:col-start-5 lg:text-h3">
              Latest News
            </h2>
            <Categories />
          </div>
          <BlogList posts={posts} />
        </div>
      </div>
    </>
  )
}

// pre build all the categories
export const generateStaticParams = async () => {
  const categories = await fetchCategoriesNonEmpty()

  categories.push({
    _title: "Home",
    _slug: ""
  })

  return categories.map((category) => ({
    slug: [category._slug]
  }))
}

export default BlogIndexPage
