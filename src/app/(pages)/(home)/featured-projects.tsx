import Image from "next/image"
import Link from "next/link"

import { TextList } from "@/components/primitives/text-list"

import { QueryType } from "./query"

export const FeaturedProjects = ({ data }: { data: QueryType }) => {
  const p = data.pages.homepage.featuredProjects.projectList.items
  return (
    <div className="grid-layout !gap-y-4">
      <h2 className="col-span-full mb-4 text-mobile-h1 text-brand-w2 lg:text-h1">
        Featured projects
      </h2>

      {p.map((project) => (
        <div key={project._title} className="grid-layout col-span-full !px-0">
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
                  <p
                    key={category._title}
                    className="actionable text-mobile-h4 text-brand-w1 lg:text-h4"
                  >
                    {category._title}
                  </p>
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
      ))}
    </div>
  )
}
