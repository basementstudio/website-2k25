"use client"

import Image from "next/image"

import { Link } from "@/components/primitives/link"
import { useMedia } from "@/hooks/use-media"
import { formatDate } from "@/utils/format-date"

import { QueryType } from "./query"

interface MoreProps {
  data: QueryType
  slug: string
}

export const More = ({ data, slug }: MoreProps) => {
  const isDesktop = useMedia("(min-width: 1024px)")
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
    <div className="grid-layout">
      <div className="col-span-full mx-auto flex w-full flex-col justify-start gap-y-4 lg:col-span-10 lg:col-start-2 lg:max-w-[846px]">
        <h2 className="text-f-h4-mobile text-brand-g1 lg:text-f-h4">
          More from the blog
        </h2>

        <div className="flex flex-col divide-y divide-brand-g1/30">
          <div />
          {morePosts.map((post) => (
            <div key={post._title} className="group relative">
              <Link
                href={`/post/${post._slug}`}
                className="flex gap-x-2 py-2 focus-visible:!ring-offset-0"
                aria-label={`View ${post._title ?? "Untitled"}`}
              >
                <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

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

                <div className="relative flex w-full justify-between gap-y-2">
                  <h3 className="line-clamp-2 w-full max-w-[70%] text-f-h3-mobile text-brand-w2 lg:text-f-h3">
                    {post._title}
                  </h3>

                  {post.date ? (
                    <p
                      className="flex-1 text-right text-f-p-mobile text-brand-g1 lg:flex-auto lg:text-f-p"
                      suppressHydrationWarning
                    >
                      {formatDate(
                        post.date ?? "",
                        false,
                        undefined,
                        isDesktop ? false : true
                      )}
                    </p>
                  ) : null}
                </div>
              </Link>
            </div>
          ))}
          <div />
        </div>
      </div>
    </div>
  )
}
