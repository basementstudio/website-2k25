"use client"

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
    <div className="col-span-full row-start-1 flex flex-col gap-2 lg:col-span-3 lg:col-start-9 lg:row-start-auto">
      <p className="text-p text-brand-g1">Categories</p>

      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {categories.map((category) => {
          const href =
            activeCategory === category?._slug
              ? "/blog"
              : `/blog/${category?._slug}`

          return (
            <a
              href={href}
              onClick={(e) => handleClick(e, href)}
              key={category?._title}
              className={cn(
                "flex w-max gap-x-1.25 text-left !text-mobile-h2 text-brand-g1 transition-colors duration-300 lg:!text-h2",
                activeCategory === category?._slug && "text-brand-w1"
              )}
            >
              <span className="actionable">{category?._title}</span>
            </a>
          )
        })}
      </ul>
    </div>
  )
}
