import { RichText } from "@/components/primitives/rich-text"

import { QueryType } from "./query"

export const Capabilities = ({ data }: { data: QueryType }) => {
  const capabilities = data.pages.homepage.capabilities
  const categories = data.company.projects.projectCategories.items

  return (
    <div className="grid-layout">
      <h3 className="col-start-3 text-h3 text-brand-g1">
        {capabilities._title}
      </h3>

      <div className="col-span-12 [&_p]:text-h1">
        <RichText>{capabilities.intro?.json?.content}</RichText>
      </div>

      <div className="grid-layout relative col-span-12 mt-24 !gap-x-4 !px-0">
        <div className="absolute inset-x-0 top-9 h-px w-full bg-brand-w1/30" />

        <div className="col-span-2"></div>

        {categories.map((c) => (
          <div
            key={c._title}
            className="col-span-2 mt-1 flex flex-col gap-y-6 text-brand-w1"
          >
            <h4 className="actionable text-h4">{c._title}</h4>

            <p className="text-h4">{c.description}</p>

            <div className="flex flex-wrap gap-2">
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

        <div className="col-span-2"></div>
      </div>
    </div>
  )
}
