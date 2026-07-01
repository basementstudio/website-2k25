import Image from "next/image"

import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"
import { getImageUrl } from "@/service/sanity/helpers"
import { cn } from "@/utils/cn"

import { fetchRelatedProjects } from "./sanity"

interface RelatedProjectsProps {
  baseSlug: string
  className?: string
}

export const RelatedProjects = async ({
  baseSlug,
  className
}: RelatedProjectsProps) => {
  const projects = await fetchRelatedProjects(baseSlug)

  return (
    <div className={cn("mt-auto flex flex-col gap-2", className)}>
      <h4 className="text-f-h4-mobile text-brand-g1 lg:text-f-h4">
        More Projects
      </h4>

      <ul className="flex flex-col divide-y divide-brand-w1/20">
        <div />
        {projects.map((item) => {
          const iconImg = getImageUrl(item.icon)
          return (
            <Link
              href={`/showcase/${item.slug}`}
              key={item._id}
              className="flex items-center justify-between pb-1.75 pt-1.5 !text-f-p-mobile font-normal text-brand-w2 transition-colors duration-300 hover:text-brand-w1 focus-visible:!ring-offset-0 lg:!text-f-p"
              aria-label={`View ${item.title ?? "Untitled"}`}
            >
              <span className="flex items-center gap-1.75">
                {iconImg ? (
                  <span className="relative size-4.5 overflow-hidden rounded-full border border-brand-w1/20 bg-brand-g2">
                    <Image
                      src={iconImg.src}
                      width={16}
                      height={16}
                      className="object-cover"
                      alt={iconImg.alt || "Client logo"}
                    />
                  </span>
                ) : null}
                <span className="line-clamp-1 flex-1" title={item.title}>
                  {item.title}
                </span>
              </span>
              <Arrow className="size-4" />
            </Link>
          )
        })}
        <div />
      </ul>
    </div>
  )
}
