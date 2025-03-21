"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { cn } from "@/utils/cn"

export const CategoriesClient = ({
  categories
}: {
  categories: { _title: string; _slug: string }[]
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const activeCategory = pathname.split("/").pop()

  const handleClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    router.push(href, { scroll: false })
  }

  return (
    <div className="col-span-full row-start-1 flex flex-col gap-1 pb-8 lg:col-span-3 lg:col-start-9 lg:row-start-auto lg:gap-2">
      <p className="text-f-p-mobile lg:text-f-h3 text-brand-g1">Categories</p>

      <ul className="flex flex-col gap-y-1 lg:flex-row lg:flex-wrap lg:gap-x-4">
        {categories.map((category) => {
          const href =
            activeCategory === category?._slug
              ? "/blog"
              : `/blog/${category?._slug}`

          return (
            <Link
              href={href}
              onClick={(e) => handleClick(e, href)}
              prefetch
              key={category?._title}
              className={cn(
                "!text-f-h2-mobile lg:!text-f-h2 flex w-max gap-x-1.25 text-left transition-colors duration-300",
                activeCategory === category._slug ||
                  (pathname === "/blog" && category._slug === "blog") ||
                  !activeCategory ||
                  activeCategory === "blog"
                  ? "text-brand-w1"
                  : "text-brand-g1"
              )}
            >
              <span className="actionable">{category?._title}</span>
            </Link>
          )
        })}
      </ul>
    </div>
  )
}
