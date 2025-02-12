import { basehub } from "basehub"
import { Pump } from "basehub/react-pump"
import Image from "next/image"

import { query } from "../query"
import { SandPackCSS } from "./components/sandbox/sandpack-styles"
import Content from "./content"
import More from "./more"
import BlogTitle from "./title"

type Params = Promise<{ slug: string }>

const Blog = async (props: { params: Params }) => {
  const resolvedParams = await props.params

  return (
    <Pump queries={[query]}>
      {async ([data]) => {
        "use server"
        const heroImage =
          data.pages.blog.posts.items.find(
            (post) => post._slug === resolvedParams.slug
          )?.hero?.heroImage?.url || ""

        return (
          <>
            <div className="fixed top-0 z-10 h-screen w-full">
              {heroImage && (
                <Image
                  src={heroImage}
                  alt={
                    data.pages.blog.posts.items.find(
                      (post) => post._slug === resolvedParams.slug
                    )?._title || ""
                  }
                  width={1920}
                  height={1080}
                  className="h-full w-full object-cover"
                  priority
                />
              )}
            </div>
            <div className="relative z-20 mt-[-10vh] bg-brand-k pb-24">
              <div className="pb-25 flex flex-col gap-24">
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
}

export async function generateStaticParams() {
  const data = await basehub({ cache: "no-store" }).query({
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
