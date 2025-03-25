import { Pump } from "basehub/react-pump"
import { notFound } from "next/navigation"

import { client } from "@/service/basehub"

import { SandPackCSS } from "./components/sandbox/sandpack-styles"
import Content from "./content"
import More from "./more"
import { query } from "./query"
import BlogTitle from "./title"

type Params = Promise<{ slug: string }>

export const dynamic = "force-static"

const Blog = async (props: { params: Params }) => {
  const resolvedParams = await props.params

  try {
    return (
      <Pump queries={[query]}>
        {async ([data]) => {
          "use server"

          return (
            <>
              <div className="relative bg-brand-k pt-12 lg:pb-24">
                <div className="lg:pb-25 flex flex-col gap-24">
                  <BlogTitle data={data} slug={resolvedParams.slug} />
                  <Content data={data} slug={resolvedParams.slug} />
                  <More data={data} slug={resolvedParams.slug} />
                </div>
              </div>

              {/* SSR CSS for Sandpack when using CodeSandbox */}
              <SandPackCSS />
            </>
          )
        }}
      </Pump>
    )
  } catch {
    return notFound()
  }
}

export async function generateStaticParams() {
  const data = await client().query({
    pages: {
      blog: {
        posts: {
          items: { _slug: true }
        }
      }
    }
  })

  return data.pages.blog.posts.items.map((post) => ({
    slug: post._slug
  }))
}

export default Blog
