import { Arrow } from "@/components/primitives/icons/arrow"
import { ImageWithVideoOverlay } from "@/components/primitives/image-with-video-overlay"
import { Link } from "@/components/primitives/link"
import { TextList } from "@/components/primitives/text-list"
import { cn } from "@/utils/cn"

import type { QueryType } from "./query"

export const FeaturedProjects = ({ data }: { data: QueryType }) => {
  const p = data.pages.homepage.featuredProjects.projectList.items

  return (
    <div className="grid-layout !gap-y-4">
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
                "!text-f-h1-mobile lg:!text-f-h1 col-span-full bg-brand-k pb-6 pt-12 text-brand-w2 lg:pt-14"
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
        "bg-brand-k",
        "border-t border-brand-w1/30",
        "col-span-full"
      )}
    >
      <div className="relative col-span-7 after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
        {project.cover && (
          <Link href={`/showcase/${project.project?._slug}`}>
            <div className="with-dots relative h-full w-full">
              <ImageWithVideoOverlay
                image={project.cover}
                video={project.coverVideo || project.project?.coverVideo}
                className="aspect-video"
              />
            </div>
          </Link>
        )}
      </div>
      <div className="col-span-2 flex flex-col justify-between gap-y-4 pr-2 md:col-span-3 md:pr-12">
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
                {category._title}
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
          <span className="translate-x-6 transition-transform duration-200 ease-in-out group-hover:translate-x-0">
            {project._title}
          </span>
          <Arrow className="size-6 opacity-0 transition-opacity delay-0 duration-100 ease-in-out hover:delay-200 group-hover:opacity-100" />
        </span>
      </Link>
    </div>
  )
}
