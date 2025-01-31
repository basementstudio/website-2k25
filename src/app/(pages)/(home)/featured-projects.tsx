import Image from "next/image"
import Link from "next/link"

import { RichText } from "@/components/primitives/rich-text"
import { TextList } from "@/components/primitives/text-list"

import { QueryType } from "./query"

export const FeaturedProjects = ({ data }: { data: QueryType }) => {
  const p = data.company.projects.projectList.items

  return (
    <div className="grid-layout !gap-y-12">
      {p.map((p, idx) => (
        <section key={p._slug} className="grid-layout group col-span-12 !px-0">
          <article className="grid-layout col-span-6 items-end !px-0">
            <p className="col-span-4 text-h1 text-brand-g1">{idx + 1}</p>

            <h2 className="actionable col-span-8 text-h2 text-brand-w1">
              <Link href={`/showcase/${p._slug}`}>{p._title}</Link>
            </h2>

            <div className="col-span-12 w-full max-w-[95%] [&_p]:text-h2 [&_p]:text-brand-w2">
              <RichText>{p.description?.json?.content}</RichText>
            </div>

            <TextList
              value={p.categories?.map((c) => c._title) ?? []}
              className="actionable col-span-4 mt-4 !text-h4 text-brand-w1"
            />
          </article>

          <div className="relative col-span-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Image
              src={p.cover?.url ?? ""}
              alt={p.cover?.alt ?? ""}
              fill
              className="object-cover"
            />
          </div>
        </section>
      ))}
    </div>
  )
}
