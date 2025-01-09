import { Pump } from "basehub/react-pump"

import { query } from "../query"
import Content from "./content"
import BlogTitle from "./title"

interface Props {
  params: {
    slug: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

const Blog = async ({ params }: Props) => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <div className="pb-25 relative flex flex-col gap-[68px] bg-brand-k">
          <BlogTitle data={data} slug={params.slug} />
          <Content data={data} slug={params.slug} />
        </div>
      )
    }}
  </Pump>
)

export default Blog
