"use client"

import Image from "next/image"

import { Link } from "@/components/primitives/link"
import { useMedia } from "@/hooks/use-media"
import { getImageUrl } from "@/service/sanity/helpers"
import { formatDate } from "@/utils/format-date"

import type { RelatedPost } from "./sanity"

interface MoreProps {
  posts: RelatedPost[]
}

export const More = ({ posts }: MoreProps) => {
  const isDesktop = useMedia("(min-width: 1024px)")

  return (
    <div className="grid-layout">
      <div className="col-span-full mx-auto flex w-full flex-col justify-start gap-y-4 lg:col-span-10 lg:col-start-2 lg:max-w-[846px]">
        <h2 className="text-f-h4-mobile text-brand-g1 lg:text-f-h4">
          More from the blog
        </h2>

        <div className="flex flex-col divide-y divide-brand-g1/30">
          <div />
          {posts.map((post) => {
            const heroImg = post.heroImage ? getImageUrl(post.heroImage) : null

            return (
              <div key={post._id} className="group relative">
                <Link
                  href={`/post/${post.slug}`}
                  className="flex gap-x-2 py-2 focus-visible:!ring-offset-0"
                  aria-label={`View ${post.title ?? "Untitled"}`}
                >
                  <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative h-[60px] w-[136px] overflow-clip after:absolute after:inset-0 after:border after:border-brand-w1/20">
                    {heroImg && (
                      <Image
                        src={heroImg.src}
                        alt={post.title}
                        width={272}
                        height={120}
                        className="h-full w-full object-cover"
                        {...(heroImg.blurDataURL
                          ? {
                              placeholder: "blur",
                              blurDataURL: heroImg.blurDataURL
                            }
                          : {})}
                      />
                    )}
                  </div>

                  <div className="relative flex w-full justify-between gap-y-2">
                    <h3 className="line-clamp-2 w-full max-w-[70%] text-f-h3-mobile text-brand-w2 lg:text-f-h3">
                      {post.title}
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
            )
          })}
          <div />
        </div>
      </div>
    </div>
  )
}
