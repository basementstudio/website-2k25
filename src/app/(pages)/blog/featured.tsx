"use client"

import Image from "next/image"

import { Link } from "@/components/primitives/link"
import { RichText } from "@/components/primitives/rich-text"
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
        <div className="col-span-12 col-start-1 grid grid-cols-12 items-end gap-2 border-b border-brand-w1/20 pb-2">
          <h2 className="col-span-3 col-start-5 text-h3 text-brand-g1">
            Latest News
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
            className="group relative col-span-12 border-b border-brand-w1/20"
          >
            <Link
              className="col-span-12 grid grid-cols-12 gap-2 py-2"
              href={`/blog/${post._slug}`}
            >
              <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative col-span-3 aspect-[418/228] overflow-clip bg-brand-g2/20 after:absolute after:inset-0 after:border after:border-brand-w1/20">
                <div className="with-dots h-full w-full">
                  {post.hero?.heroImage?.url && (
                    <Image
                      src={post.hero?.heroImage?.url}
                      alt={post.hero?.heroImage.alt || ""}
                      width={post.hero?.heroImage?.width || 418}
                      height={post.hero?.heroImage?.height || 228}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
              <h2 className="col-start-5 col-end-8 py-1 text-h2 text-brand-w2">
                {post._title}
              </h2>
              <div className="relative col-span-4 col-start-9 grid grid-cols-4 content-start gap-y-4 py-1">
                <div className="col-start-1 col-end-4 block text-brand-w2">
                  <RichText
                    components={{
                      p: ({ children }) => <p className="text-h4">{children}</p>
                    }}
                  >
                    {post.intro?.json.content}
                  </RichText>
                </div>
                <hr className="col-start-1 col-end-5 w-full border-dashed border-brand-w1/20" />
                <div className="col-span-2 col-start-1 flex flex-wrap gap-1 text-p">
                  {post.categories?.map((category) => (
                    <p
                      key={category._title}
                      className="h-max w-max bg-brand-g2 px-1 text-[11px] text-brand-w2"
                    >
                      {category._title}
                    </p>
                  ))}
                </div>
                <p className="text-paragraph col-span-2 col-start-3 text-p text-brand-w2">
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
