import Link from "next/link"

import { RichText } from "@/components/primitives/rich-text"

import { QueryType } from "./query"

export const Capabilities = ({ data }: { data: QueryType }) => {
  const capabilities = data.pages.homepage.capabilities
  const categories = data.company.projects.projectCategories.items

  return (
    <div className="grid-layout">
      <h3 className="col-start-3 mb-2 text-h3 text-brand-g1">
        {capabilities._title}
      </h3>

      <div className="col-span-12 [&_p]:text-h1">
        <RichText>{capabilities.intro?.json?.content}</RichText>
      </div>

      <div className="grid-layout relative col-span-12 mt-16 !gap-x-4 !px-0">
        <div className="absolute inset-x-0 top-9 h-px w-full bg-brand-w1/30" />

        <div className="col-start-3 col-end-11 grid grid-cols-8 gap-6">
          {categories.map((c) => (
            <div
              key={c._title}
              className="col-span-2 mt-1.25 flex flex-col gap-y-6 text-brand-w1"
            >
              <h4 className="text-h4">
                <Link
                  className="actionable"
                  href={`/showcase?category=${encodeURIComponent(c._title)}`}
                >
                  {c._title}
                </Link>
              </h4>

              <p className="-mt-1 text-h4">{c.description}</p>

              <div className="flex flex-wrap gap-1">
                {c.subCategories.items.map((s) => (
                  <p
                    key={s._title}
                    className="bg-brand-g2 px-1 text-p text-brand-w1"
                  >
                    {s._title}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
