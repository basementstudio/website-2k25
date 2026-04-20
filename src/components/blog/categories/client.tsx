"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { cn } from "@/utils/cn"

interface CategoriesClientProps {
  categories: { title: string; slug: string }[]
}

export const CategoriesClient = ({ categories }: CategoriesClientProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const activeCategory = pathname.split("/").pop()

  return (
    <div className="col-span-full row-start-1 flex flex-col gap-1 pb-8 lg:col-span-3 lg:col-start-9 lg:row-start-auto lg:gap-2">
      <p className="text-f-p-mobile text-brand-g1 lg:text-f-h3">Categories</p>

      <ul className="flex flex-col gap-y-1 lg:flex-row lg:flex-wrap lg:gap-x-4">
        {categories.map((category) => {
          const href =
            activeCategory === category?.slug
              ? "/blog"
              : `/blog/${category?.slug}`

          return (
            <Link
              href={href}
              onClick={() => router.push(href, { scroll: false })}
              prefetch
              key={category?.title}
              className={cn(
                "flex w-max gap-x-1.25 text-left !text-f-h2-mobile transition-colors duration-300 lg:!text-f-h2",
                activeCategory === category.slug ||
                  (pathname === "/blog" && category.slug === "blog") ||
                  !activeCategory ||
                  activeCategory === "blog"
                  ? "text-brand-w1"
                  : "text-brand-g1"
              )}
            >
              <span className="actionable">{category?.title}</span>
            </Link>
          )
        })}
      </ul>
    </div>
  )
}
