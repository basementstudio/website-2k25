import Image from "next/image"

import { Link } from "@/components/primitives/link"
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
    <div className="mx-auto flex w-full max-w-[846px] flex-col justify-start gap-y-4 px-4 lg:px-0">
      <h2 className="text-mobile-h4 text-brand-g1 lg:text-h4">
        More from the blog
      </h2>

      <div className="flex flex-col divide-y divide-brand-g1/30">
        <div />
        {morePosts.map((post) => (
          <div key={post._title} className="group relative">
            <Link href={`/blog/${post._slug}`} className="flex gap-x-2 py-2">
              <div className="relative h-[60px] w-[136px] overflow-clip after:absolute after:inset-0 after:border after:border-brand-w1/20">
                {post.hero?.heroImage?.url && (
                  <Image
                    src={post.hero?.heroImage?.url ?? ""}
                    alt={post._title}
                    width={272}
                    height={120}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="flex w-full justify-between gap-y-2">
                <h3 className="line-clamp-2 w-full max-w-[70%] text-mobile-h3 text-brand-w2 lg:text-h3">
                  {post._title}
                </h3>

                {post.date ? (
                  <p className="flex-1 text-right text-mobile-p text-brand-g1 lg:flex-auto lg:text-p">
                    {formatDate(post.date ?? "")}
                  </p>
                ) : null}
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
