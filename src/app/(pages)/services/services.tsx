import { RichText } from "basehub/react-rich-text"

import { cn } from "@/utils/cn"

import { QueryType } from "./query"

export const Services = ({ data }: { data: QueryType }) => {
  return (
    <section className="grid-layout !gap-x-0 !gap-y-14">
      {data.company.services.serviceCategories.items.map((category, index) => (
        <article
          key={category._title}
          className={cn("flex flex-col gap-2", {
            "col-start-1 col-end-6": index % 2 === 0,
            "col-start-6 col-end-13 grid grid-cols-7": index % 2 !== 0
          })}
        >
          <h3 className="col-span-7 text-h3 text-brand-g1">
            {category._title}
          </h3>
          <hr className="col-span-7 -mt-px border-brand-w1/30" />
          <div className="col-span-5 text-h2 text-brand-w2">
            <RichText>{category.description?.json.content}</RichText>
          </div>
        </article>
      ))}
    </section>
  )
}
