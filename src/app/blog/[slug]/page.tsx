import { Pump } from "basehub/react-pump"

import { query } from "../query"
import Content from "./content"
import BlogTitle from "./title"

type Params = Promise<{ slug: string }>

const Blog = async (props: { params: Params }) => {
  const resolvedParams = await props.params

  return (
    <Pump queries={[query]}>
      {async ([data]) => {
        "use server"

        return (
          <div className="pb-25 relative flex flex-col gap-[68px] bg-brand-k">
            <BlogTitle data={data} slug={resolvedParams.slug} />
            <Content data={data} slug={resolvedParams.slug} />
          </div>
        )
      }}
    </Pump>
  )
}

export default Blog
