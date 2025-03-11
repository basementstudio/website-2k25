import Image from "next/image"
import Link from "next/link"

import { RichText } from "@/components/primitives/rich-text"
import { formatDate } from "@/utils/format-date"

import { fetchFeaturedPost } from "./basehub"

export async function Featured() {
  const post = await fetchFeaturedPost()

  return (
    <section className="grid-layout">
      <div className="col-span-full grid grid-cols-12">
        <div className="col-span-full grid grid-cols-12 items-end gap-2 border-b border-brand-w1/20 pb-2">
          <h2 className="col-span-full text-mobile-h3 text-brand-g1 lg:col-span-3 lg:col-start-5 lg:text-h3">
            Latest News
          </h2>
        </div>
        {post && (
          <div
            key={post._slug}
            className="group relative col-span-full border-b border-brand-w1/20"
          >
            <Link
              className="col-span-full grid grid-cols-12 gap-2 py-2 pb-4 lg:pb-2"
              href={`/post/${post._slug}`}
            >
              <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative col-span-full my-auto aspect-[418/228] overflow-clip bg-brand-g2/20 after:absolute after:inset-0 after:border after:border-brand-w1/20 lg:col-span-3">
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
              <h2 className="col-span-full py-1 text-mobile-h2 text-brand-w2 lg:col-start-5 lg:col-end-8 lg:text-h2">
                {post._title}
              </h2>
              <div className="relative col-span-full grid grid-cols-4 content-start gap-y-4 py-1 lg:col-span-4 lg:col-start-9">
                <div className="col-span-full block text-brand-w2 lg:col-span-4">
                  <RichText
                    components={{
                      p: ({ children }) => <p className="text-h4">{children}</p>
                    }}
                  >
                    {post.intro?.json.content}
                  </RichText>
                </div>
                <hr className="col-start-1 col-end-5 hidden w-full border-dashed border-brand-w1/20 lg:block" />
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
        )}
      </div>
    </section>
  )
}
