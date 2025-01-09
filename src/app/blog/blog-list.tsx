"use client"

import Image from "next/image"
import Link from "next/link"

import { formatDate } from "@/utils/format-date"

import { QueryType } from "./query"

interface BlogListProps {
  data?: QueryType
  selectedCategories?: string[]
}

export default function BlogList({
  data,
  selectedCategories = []
}: BlogListProps) {
  if (!data) return null

  const posts = data.pages.blog.posts.items
    .filter(
      (post) =>
        selectedCategories.length === 0 ||
        post.categories?.some((cat) => selectedCategories.includes(cat._title))
    )
    .sort(
      (a, b) =>
        new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
    )
    .slice(2)

  return (
    <section className="grid-layout pb-[35px]">
      <div className="col-span-12 grid grid-cols-12">
        <h2 className="col-span-12 col-start-1 border-b border-brand-w1/20 pb-3 text-subheading capitalize text-brand-w2">
          more news
        </h2>

        {posts.map((post) => (
          <div
            key={post._slug}
            className="group relative col-span-12 border-b border-brand-w1/20 py-2"
          >
            <Link
              className="col-span-12 grid grid-cols-12 gap-2"
              href={`/blog/${post._slug}`}
            >
              <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="with-dots col-span-2 h-[124px] w-full max-w-[276px] overflow-clip bg-brand-g2/20">
                {post.heroImage?.url && (
                  <Image
                    src={post.heroImage?.url}
                    alt={post._title || ""}
                    width={276}
                    height={124}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <p className="col-start-5 col-end-8 text-subheading text-brand-w2">
                {post._title}
              </p>
              <div className="col-span-2 col-start-9 flex gap-1">
                {post.categories?.map((category) => (
                  <p
                    key={category._title}
                    className="h-max w-max bg-brand-g2 px-1 text-[11px] text-brand-w2"
                  >
                    {category._title}
                  </p>
                ))}
              </div>
              <p className="col-span-1 col-start-11 text-paragraph text-brand-w2">
                {formatDate(post.date || "")}
              </p>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
