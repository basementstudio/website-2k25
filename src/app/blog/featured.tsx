"use client"

import { RichText } from "basehub/react-rich-text"
import Image from "next/image"
import Link from "next/link"

import { formatDate } from "@/utils/format-date"

import { Filters } from "./filters"
import { QueryType } from "./query"

interface FeaturedProps {
  data?: QueryType
  selectedCategories?: string[]
  setSelectedCategories?: (categories: string[]) => void
  categories?: string[]
}

export default function Featured({
  data,
  selectedCategories = [],
  setSelectedCategories = () => {},
  categories = []
}: FeaturedProps) {
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

  const featuredPosts = [...posts].slice(0, 2)

  return (
    <section className="grid-layout">
      <div className="col-span-12 grid grid-cols-12">
        <div className="col-span-12 col-start-1 grid grid-cols-12 gap-2 border-b border-brand-w1/20 pb-3">
          <h2 className="col-span-3 col-start-1 text-subheading capitalize text-brand-w2">
            latest news
          </h2>
          <div className="col-span-2 col-start-9 flex items-end">
            <Filters
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              categories={categories}
            />
          </div>
        </div>
        {featuredPosts.map((post) => (
          <div
            key={post._slug}
            className="group relative col-span-12 border-b border-brand-w1/20 py-3"
          >
            <Link
              className="col-span-12 grid grid-cols-12 gap-2"
              href={`/blog/${post._slug}`}
            >
              <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="with-dots col-span-3 h-[228px] w-full max-w-[418px] overflow-clip border border-brand-w1/20 bg-brand-g2/20">
                {post.hero?.heroImage?.url && (
                  <Image
                    src={post.hero?.heroImage?.url}
                    alt={post.hero?.heroImage.alt || ""}
                    width={418}
                    height={228}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <h2 className="col-start-5 col-end-8 text-subheading text-brand-w2">
                {post._title}
              </h2>
              <div className="relative col-span-4 col-start-9 grid grid-cols-4 content-start gap-y-2">
                <div className="col-start-1 col-end-4 block text-paragraph text-brand-w2">
                  <RichText content={post.intro?.json.content} />
                </div>
                <hr className="col-start-1 col-end-5 mt-4 w-full border-brand-w1/20" />
                <div className="col-span-2 col-start-1 flex gap-1">
                  {post.categories?.map((category) => (
                    <p
                      key={category._title}
                      className="h-max w-max bg-brand-g2 px-1 text-[11px] text-brand-w2"
                    >
                      {category._title}
                    </p>
                  ))}
                </div>
                <p className="col-span-2 col-start-3 text-paragraph text-brand-w2">
                  {formatDate(post.date || "")}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
