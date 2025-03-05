import Image from "next/image"
import Link from "next/link"

import { TextList } from "@/components/primitives/text-list"
import { cn } from "@/utils/cn"

import { QueryType } from "./query"

export const FeaturedProjects = ({ data }: { data: QueryType }) => {
  const p = data.pages.homepage.featuredProjects.projectList.items

  return (
    <div className="grid-layout mt-12 !gap-y-4">
      <div className="sticky top-0 col-span-full">
        <h2
          className={cn(
            "col-span-full bg-brand-k pb-4 pt-12 text-mobile-h1 text-brand-w2 lg:pt-14 lg:text-h1"
          )}
        >
          Featured projects
        </h2>
      </div>

      {p.map((project, index) => (
        <ProjectItem key={project._title} project={project} index={index} />
      ))}
    </div>
  )
}

const ProjectItem = ({
  project,
  index
}: {
  project: QueryType["pages"]["homepage"]["featuredProjects"]["projectList"]["items"][0]
  index: number
}) => {
  return (
    <div
      key={project._title}
      className={cn(
        "grid-layout bg-transparent !px-0 py-2",
        "transition-transform duration-300",
        "[background-image:linear-gradient(#000000_1px,transparent_1px),linear-gradient(to_right,#000000_1px,rgba(0,0,0,0.7)_1px)] [background-position-y:1px] [background-size:2px_2px]",
        "border-t border-brand-w1/30",
        "sticky top-24 lg:top-[9.5rem]",
        "stacked-card col-span-full"
      )}
      style={{ zIndex: index + 1 }}
    >
      <div className="relative col-span-7 after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
        <div className="with-dots relative h-full w-full">
          <Image
            src={project.cover?.url ?? ""}
            alt={project._title}
            width={project.cover?.width ?? 0}
            height={project.cover?.height ?? 0}
          />
        </div>
      </div>
      <div className="col-span-2 flex flex-col gap-y-4">
        <p className="text-mobile-h4 text-brand-w2 lg:text-h4">
          {project.excerpt}
        </p>

        <TextList
          value={
            project.project?.categories?.map((category) => (
              <span
                key={category._title}
                className="actionable text-mobile-h4 text-brand-w1 lg:text-h4"
              >
                {category._title}
              </span>
            )) ?? []
          }
        />
      </div>

      <Link
        href={`/showcase/${project.project?._slug}`}
        className="actionable h-max text-right text-mobile-h2 text-brand-w1 lg:col-span-2 lg:col-start-11 lg:text-h2"
      >
        {project._title}
      </Link>
    </div>
  )
}
