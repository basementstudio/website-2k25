"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useFormStatus } from "react-dom"

import { Post } from "@/app/(pages)/blog/basehub"
import { formatDate } from "@/utils/format-date"

import { getPosts } from "./actions"

const POSTS_PER_PAGE = 10

export const BlogListClient = ({
  params,
  initialPosts,
  total
}: {
  params: { slug: string[] }
  initialPosts: Post[]
  total: number
}) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(total > POSTS_PER_PAGE)
  const { pending } = useFormStatus()

  let category: string | undefined = undefined

  if (!params.slug) {
    category = undefined
  } else {
    if (isNaN(parseInt(params.slug[0]))) {
      category = params.slug[0]
    }
  }

  const handleLoadMore = async () => {
    try {
      const result = await getPosts(currentPage + 1, category)

      if (result.posts.length > 0) {
        setPosts([...posts, ...result.posts])
        setCurrentPage(result.nextPage)
      }
    } catch (error) {
      console.error("Error loading more posts:", error)
    }
  }

  return (
    <>
      {posts.map((post) => (
        <div
          key={post._slug}
          className="group relative col-span-full border-b border-brand-w1/20"
        >
          <Link
            className="col-span-full grid grid-cols-12 gap-2 py-2 pb-4 lg:pb-2"
            href={`/post/${post._slug}`}
          >
            <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative col-span-full my-auto aspect-[418/228] w-full overflow-clip bg-brand-g2/20 after:absolute after:inset-0 after:border after:border-brand-w1/20 lg:col-span-2 lg:aspect-auto lg:h-[124px] lg:max-w-[276px]">
              <div className="with-dots h-full w-full">
                {post.hero?.heroImage?.url && (
                  <Image
                    src={post.hero?.heroImage?.url}
                    alt={post.hero?.heroImage.alt || ""}
                    width={276}
                    height={124}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
            <p className="lg:col-span-[auto] col-span-full text-mobile-h3 text-brand-w2 lg:col-start-5 lg:col-end-8 lg:text-h3">
              {post._title}
            </p>
            <div className="col-span-6 flex gap-1 lg:col-span-2 lg:col-start-9 lg:col-end-10">
              {post.categories?.map((category) => (
                <p
                  key={category._title}
                  className="h-max w-max bg-brand-g2 px-1 text-mobile-p text-brand-w2 lg:text-p"
                >
                  {category._title}
                </p>
              ))}
            </div>
            {post.date ? (
              <p className="col-span-6 text-mobile-p text-brand-w2 lg:col-span-2 lg:col-start-11 lg:text-p">
                {formatDate(post.date || "")}
              </p>
            ) : null}
          </Link>
        </div>
      ))}
      {hasMore && (
        <form
          action={handleLoadMore}
          className="col-span-2 ml-auto mt-4 flex w-full justify-center"
        >
          <button
            className="actionable relative z-10 flex items-center gap-x-1 bg-brand-k text-h4 text-brand-w1"
            disabled={pending}
          >
            <span>{pending ? "Loading..." : "Show More"} </span>{" "}
          </button>
        </form>
      )}
    </>
  )
}
