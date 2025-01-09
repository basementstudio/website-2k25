import { Pump } from "basehub/react-pump"
import Image from "next/image"

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
          <>
            <div className="fixed top-0 z-10 h-screen w-full">
              <Image
                src={
                  data.pages.blog.posts.items.find(
                    (post) => post._slug === resolvedParams.slug
                  )?.heroImage?.url || ""
                }
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
            </div>
            <div className="mt-screen relative z-20 bg-brand-k">
              <div className="pb-25 flex flex-col gap-[68px]">
                <BlogTitle data={data} slug={resolvedParams.slug} />
                <Content data={data} slug={resolvedParams.slug} />
              </div>
              {/* TODO: stupid method to hide gaps, must rework how we cover scene with blog image */}
              <div className="absolute -bottom-36 left-0 h-36 w-full bg-brand-k" />
            </div>
          </>
        )
      }}
    </Pump>
  )
}

export default Blog
