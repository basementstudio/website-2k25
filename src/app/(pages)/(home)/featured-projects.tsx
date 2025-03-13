import Image from "next/image"

import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"
import { TextList } from "@/components/primitives/text-list"
import { cn } from "@/utils/cn"

import type { QueryType } from "./query"

export const FeaturedProjects = ({ data }: { data: QueryType }) => {
  const p = data.pages.homepage.featuredProjects.projectList.items

  return (
    <div className="grid-layout mt-12 !gap-y-4">
      {p.map((project, index) => (
        <div
          key={project._title}
          className={cn(
            "col-span-full",
            "sticky top-[6.7rem] lg:top-[9.2rem]",
            index === 0 && "!top-0 lg:!top-0"
          )}
          style={{ zIndex: index + 1 }}
        >
          {index === 0 && (
            <h2
              className={cn(
                "col-span-full bg-brand-k pb-6 pt-12 !text-mobile-h1 text-brand-w2 lg:pt-14 lg:!text-h1"
              )}
            >
              Featured Projects
            </h2>
          )}
          <ProjectItem project={project} />
        </div>
      ))}
    </div>
  )
}

const ProjectItem = ({
  project
}: {
  project: QueryType["pages"]["homepage"]["featuredProjects"]["projectList"]["items"][0]
}) => {
  return (
    <div
      key={project._title}
      className={cn(
        "grid-layout bg-transparent !px-0 py-2",
        "transition-transform duration-300",
        "[background-image:linear-gradient(#000000_1px,transparent_1px),linear-gradient(to_right,#000000_1px,rgba(0,0,0,0.7)_1px)] [background-position-y:1px] [background-size:2px_2px]",
        "border-t border-brand-w1/30",
        "stacked-card col-span-full"
      )}
    >
      <div className="relative col-span-7 after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
        <div className="relative w-full h-full with-dots">
          <Image
            alt={project._title ?? project.cover?.alt ?? ""}
            blurDataURL={project.cover?.blurDataURL ?? ""}
            draggable={false}
            height={project.cover?.height ?? 0}
            placeholder="blur"
            quality={100}
            src={project.cover?.url ?? ""}
            width={project.cover?.width ?? 0}
          />
        </div>
      </div>
      <div className="flex flex-col justify-between col-span-2 pr-2 gap-y-4 md:col-span-3 md:pr-12">
        <p className="text-mobile-h4 text-brand-w2 lg:text-h3">
          {project.excerpt}
        </p>

        <TextList
          className="!flex-col"
          showComma={false}
          value={
            project.project?.categories?.map((category) => (
              <span
                key={category._title}
                className="text-mobile-h4 text-brand-w1 lg:text-h4"
              >
                <span className="actionable">{category._title}</span>
              </span>
            )) ?? []
          }
        />
      </div>

      <Link
        href={`/showcase/${project.project?._slug}`}
        className="h-max w-max justify-self-end pr-0.5 text-right text-mobile-h2 text-brand-w1 lg:col-span-2 lg:col-start-11 lg:text-h2"
      >
        <span className="actionable group gap-x-2 [&:before]:delay-0 [&:before]:hover:delay-150">
          <span className="transition-transform duration-200 ease-in-out translate-x-6 group-hover:translate-x-0">
            {project._title}
          </span>
          <Arrow className="transition-opacity duration-100 ease-in-out opacity-0 size-6 delay-0 hover:delay-200 group-hover:opacity-100" />
        </span>
      </Link>
    </div>
  )
}
