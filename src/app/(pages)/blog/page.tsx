import { Pump } from "basehub/react-pump"
import { Suspense } from "react"

import BlogList from "./blog-list"
import BlogPosts from "./blogs"
import Featured from "./featured"
import Hero from "./hero"
import { query } from "./query"

const Blogs = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"
      const categories = Array.from(
        new Set(
          data.pages.blog.posts.items.flatMap((post) =>
            post.categories?.map((cat) => cat._title)
          )
        )
      ).filter((c): c is string => c !== undefined)

      return (
        <div
          id="blog"
          className="pb-25 relative flex flex-col gap-18 bg-brand-k lg:gap-40"
        >
          <Hero data={data} />
          <Suspense fallback={null}>
            <BlogPosts data={data} categories={categories}>
              <Featured />
              <BlogList />
            </BlogPosts>
          </Suspense>
        </div>
      )
    }}
  </Pump>
)

export default Blogs
