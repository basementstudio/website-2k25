import { Pump } from "basehub/react-pump"

import { Grid } from "@/components/grid"

import BlogList from "./blog-list"
import Featured from "./fatured"
import { query } from "./query"

const Blog = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <main className="relative -mt-24 flex flex-col gap-61 bg-brand-k pb-25 pt-3 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
          <Grid />

          <section className="grid-layout">
            <h1 className="col-start-1 col-end-5 text-heading uppercase text-brand-w2">
              Blog
            </h1>
            <p className="col-start-5 text-heading text-brand-g1">
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
