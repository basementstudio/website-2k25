import { Pump } from "basehub/react-pump"

import BlogList from "./blog-list"
import Featured from "./featured"
import { query } from "./query"

const Blog = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <main className="relative flex flex-col gap-[68px] bg-brand-k pb-25 text-heading uppercase">
          <section className="grid-layout">
            <h1 className="col-start-1 col-end-5 text-brand-w2">Blog</h1>
            <p className="col-span-1 col-start-5 text-brand-g1">
              {data.pages.blog.posts.items.length}
            </p>
          </section>

          <Featured data={data} />
          <BlogList data={data} />
        </main>
      )
    }}
  </Pump>
)

export default Blog
