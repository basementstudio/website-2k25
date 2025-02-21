import Image from "next/image"
import Link from "next/link"

import { TextList } from "@/components/primitives/text-list"

import { QueryType } from "./query"

export const FeaturedProjects = ({ data }: { data: QueryType }) => {
  const p = data.pages.homepage.featuredProjects.projectList.items
  return (
    <div className="grid-layout !gap-y-14">
      {p.map((p, idx) => (
        <section
          key={p.project?._slug}
          className="grid-layout group col-span-full !px-0"
        >
          <article className="grid-layout col-span-full items-end !px-0 lg:col-span-6">
            <p className="text-mobile-h1 col-span-1 -mb-2 text-brand-g1 lg:col-span-4 lg:text-h1">
              {idx + 1}
            </p>

            <h2 className="actionable text-mobile-h3 col-span-3 -mb-2 text-brand-w1 lg:col-span-8 lg:text-h2">
              <Link href={`/showcase/${p.project?._slug}`}>{p._title}</Link>
            </h2>

            <div className="[&_p]:text-mobile-h3 col-span-full w-full max-w-[95%] [&_p]:text-brand-w2 lg:[&_p]:text-h2">
              <p>{p.excerpt}</p>
            </div>

            <div className="with-dots relative col-span-full mt-4 aspect-video overflow-clip lg:hidden">
              <Image
                src={p.project?.cover?.url ?? ""}
                alt={p.project?.cover?.alt ?? ""}
                fill
                className="border border-brand-w1/20 object-cover"
              />
            </div>

            <TextList
              value={p.project?.categories?.map((c) => c._title) ?? []}
              className="actionable col-span-4 mt-4 gap-y-1 !text-h4 text-brand-w1"
            />
          </article>

          <div className="relative col-span-full hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:col-span-6">
            <Image
              src={p.project?.cover?.url ?? ""}
              alt={p.project?.cover?.alt ?? ""}
              fill
              className="object-cover"
            />
          </div>
        </section>
      ))}
    </div>
  )
}
