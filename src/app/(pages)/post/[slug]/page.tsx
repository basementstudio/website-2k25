import { basehub } from "basehub"
import { Pump } from "basehub/react-pump"
import { notFound } from "next/navigation"

import { SandPackCSS } from "./components/sandbox/sandpack-styles"
import { Content } from "./content"
import { More } from "./more"
import { query } from "./query"
import { BlogTitle } from "./title"

interface ProjectPostProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-static"

// TODO: Make this dynamic
export const generateMetadata = async ({ params }: ProjectPostProps) => {
  const { slug } = await params

  const data = await basehub().query({
    pages: {
      blog: {
        posts: {
          __args: {
            first: 1,
            filter: {
              _sys_slug: {
                eq: slug
              }
            }
          },
          items: {
            _title: true
          }
        }
      }
    }
  })

  if (data.pages.blog.posts.items.length === 0) return null
  const post = data.pages.blog.posts.items[0]

  return {
    title: {
      absolute: `${post._title ?? "Untitled"} | Blog`
    },
    alternates: {
      canonical: `https://basement.studio/post/${slug}`
    }
  }
}

const Blog = async ({ params }: ProjectPostProps) => {
  const { slug } = await params

  try {
    return (
      <Pump queries={[query]}>
        {async ([data]) => {
          "use server"

          return (
            <>
              <div className="relative bg-brand-k pt-12 lg:pb-24">
                <div className="lg:pb-25 flex flex-col gap-24">
                  <BlogTitle data={data} slug={slug} />
                  <Content data={data} slug={slug} />
                  <More data={data} slug={slug} />
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
