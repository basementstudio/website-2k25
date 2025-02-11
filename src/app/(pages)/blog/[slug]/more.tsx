import Image from "next/image"
import Link from "next/link"

import { formatDate } from "@/utils/format-date"

import { QueryType } from "../query"

export default function More({
  data,
  slug
}: {
  data: QueryType
  slug: string
}) {
  const currentPost = data.pages.blog.posts.items.find(
    (post) => post._slug === slug
  )
  const currentPostCategories = currentPost?.categories?.map(
    (category) => category._title
  )

  const morePosts = data.pages.blog.posts.items
    .filter((post) => {
      return post.categories?.some((category) =>
        currentPostCategories?.includes(category._title)
      )
    })
    .filter((post) => post._slug !== slug)
    .slice(0, 3)

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col justify-start gap-y-4">
      <h2 className="text-h4 text-brand-g1">More from the blog</h2>

      <div className="flex flex-col divide-y divide-brand-g1">
        <div />
        {morePosts.map((post) => (
          <div key={post._title} className="group relative">
            <Link href={`/blog/${post._slug}`} className="flex gap-x-2 py-2">
              <div className="with-dots relative h-[60px] w-[136px] overflow-clip border border-brand-w1/20">
                {post.hero?.heroImage?.url && (
                  <Image
                    src={post.hero?.heroImage?.url ?? ""}
                    alt={post._title}
                    fill
                  />
                )}
              </div>

              <div className="flex w-full justify-between gap-y-2">
                <h3 className="w-full max-w-[70%] text-h3 text-brand-w2">
                  {post._title}
                </h3>

                <p className="text-p text-brand-g1">
                  {formatDate(post.date ?? "")}
                </p>
              </div>

              <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          </div>
        ))}
        <div />
      </div>
    </div>
  )
}
