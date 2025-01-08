import { Pump } from "basehub/react-pump"

import { query } from "../query"
import BlogTitle from "./title"

const Blog = ({ params }: { params: { slug: string } }) => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <div className="pb-25 relative flex flex-col gap-[68px] bg-brand-k">
          <BlogTitle data={data} slug={params.slug} />
        </div>
      )
    }}
  </Pump>
)

export default Blog
