import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"
import { TextList } from "@/components/primitives/text-list"
import { cn } from "@/utils/cn"

import type { QueryType } from "./query"
import { ShowcaseImage } from "./showcase-image"

export const FeaturedProjects = ({ data }: { data: QueryType }) => {
  const p = data.pages.homepage.featuredProjects.projectList.items

  return (
    <div className="grid-layout !gap-y-0">
      {p.map((project, index) => (
        <div
          key={project._title}
          className={cn(
            "col-span-full",
            "sticky top-[6.7rem] lg:top-[9.2rem]",
            index === 0 && "!top-0 lg:!top-0",
            index === p.length - 1 && "top-[6.8rem] lg:top-[9.3rem]"
          )}
          style={{ zIndex: index + 1 }}
        >
          {index === 0 && (
            <h2
              className={cn(
                "col-span-full bg-brand-k pb-6 pt-12 !text-f-h1-mobile text-brand-w2 lg:pt-14 lg:!text-f-h1"
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

interface ProjectItemProps {
  project: QueryType["pages"]["homepage"]["featuredProjects"]["projectList"]["items"][0]
}

const ProjectItem = ({ project }: ProjectItemProps) => (
  <div
    key={project._title}
    className={cn(
      "grid-layout bg-transparent !px-0 py-4",
      "transition-transform duration-300",
      "bg-brand-k",
      "border-t border-brand-w1/30",
      "col-span-full"
    )}
  >
    <div className="relative col-span-full after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20 lg:col-span-7">
      <ShowcaseImage project={project} />
    </div>
    <div className="col-span-full flex flex-col justify-between gap-y-2 md:col-span-3 md:pr-12 lg:pr-2">
      <Link
        href={`/showcase/${project.project?._slug}`}
        className="text-f-h2-mobile lg:text-f-h2 text-brand-w1 md:hidden"
      >
        <span className="actionable">{project._title}</span>
      </Link>

      <p className="text-f-h4-mobile lg:text-f-h4 text-brand-w2">
        {project.excerpt}
      </p>

      <TextList
        className="hidden !flex-col lg:!flex"
        showComma={false}
        value={
          project.project?.categories?.map((category) => (
            <span
              key={category._title}
              className="text-f-h4-mobile lg:text-f-h4 text-brand-w1"
            >
              {category._title}
            </span>
          )) ?? []
        }
      />
    </div>

    <Link
      href={`/showcase/${project.project?._slug}`}
      className="text-f-h2-mobile lg:text-f-h2 hidden h-max w-max justify-self-end pr-0.5 text-right text-brand-w1 md:block lg:col-span-2 lg:col-start-11"
    >
      <span className="actionable group gap-x-2 [&:before]:delay-0 [&:before]:hover:delay-150">
        <span className="translate-x-6 transition-transform duration-200 ease-in-out group-hover:translate-x-0">
          {project._title}
        </span>
        <Arrow className="size-6 opacity-0 transition-opacity delay-0 duration-100 ease-in-out hover:delay-200 group-hover:opacity-100" />
      </span>
    </Link>
  </div>
)
