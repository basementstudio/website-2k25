import Image from "next/image"
import Link from "next/link"

import { fetchPosts } from "@/app/(pages)/blog/basehub"
import { formatDate } from "@/utils/format-date"

export const BlogList = async ({ params }: { params: { slug: string[] } }) => {
  const { posts } = await fetchPosts(params.slug ? params.slug[0] : undefined)

  return (
    <div className="col-span-full flex flex-col gap-12 lg:gap-3">
      {posts.map((post) => (
        <div
          key={post._slug}
          className="group relative col-span-full -mb-3 border-b border-brand-w1/20"
        >
          <Link
            className="col-span-full grid grid-cols-12 gap-2 py-2 pb-2 lg:pb-2"
            href={`/post/${post._slug}`}
          >
            <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative col-span-full my-auto aspect-[418/228] w-full overflow-clip bg-brand-g2/20 after:absolute after:inset-0 after:border after:border-brand-w1/20 lg:col-span-2 lg:aspect-auto lg:h-[124px] lg:max-w-[276px]">
              <div className="with-dots h-full w-full">
                {post.hero?.heroImage?.url && (
                  <Image
                    src={post.hero?.heroImage?.url}
                    alt={post.hero?.heroImage.alt || ""}
                    fill
                    sizes="(max-width: 1024px) 100vw, 276px"
                    className="h-full w-full object-cover"
                    quality={100}
                  />
                )}
              </div>
            </div>
            <p className="lg:col-span-[auto] relative col-span-full text-f-h3-mobile text-brand-w2 lg:col-start-5 lg:col-end-8 lg:text-f-h3">
              {post._title}
            </p>
            <div className="relative col-span-6 flex gap-1 lg:col-span-2 lg:col-start-9 lg:col-end-10">
              {post.categories?.map((category) => (
                <p
                  key={category._title}
                  className="h-max w-max bg-brand-g2 px-1 text-f-p-mobile text-brand-w2 lg:text-f-p"
                >
                  {category._title}
                </p>
              ))}
            </div>
            {post.date ? (
              <p className="relative col-span-6 text-right text-f-p-mobile text-brand-w2 lg:col-span-2 lg:col-start-11 lg:text-left lg:text-f-p">
                {formatDate(post.date || "")}
              </p>
            ) : null}
          </Link>
        </div>
      ))}
    </div>
  )
}
