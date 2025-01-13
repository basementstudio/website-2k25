import { Pump } from "basehub/react-pump"

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
        <div className="pb-25 relative flex flex-col gap-[168px] bg-brand-k">
          <Hero data={data} />
          <BlogPosts data={data} categories={categories}>
            <Featured />
            <BlogList />
          </BlogPosts>
        </div>
      )
    }}
  </Pump>
)

export default Blogs
