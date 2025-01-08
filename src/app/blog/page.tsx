import { Pump } from "basehub/react-pump"

import BlogList from "./blog-list"
import BlogPosts from "./blogs"
import Featured from "./featured"
import Hero from "./hero"
import { query } from "./query"

const Blog = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <div className="pb-25 relative flex flex-col gap-[68px] bg-brand-k">
          <Hero data={data} />
          <BlogPosts data={data}>
            <Featured />
            <BlogList />
          </BlogPosts>
        </div>
      )
    }}
  </Pump>
)

export default Blog
