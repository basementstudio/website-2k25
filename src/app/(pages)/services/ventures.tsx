import { RichText } from "@/components/primitives/rich-text"

import { QueryType } from "./query"

export const VenturesBanner = ({ data }: { data: QueryType }) => {
  return (
    <div className="grid-layout">
      <h2 className="text-mobile-h2 col-span-full text-brand-g1 lg:col-start-3 lg:col-end-6 lg:text-h2">
        {data.pages.services.ventures.title}
      </h2>

      <div className="[&_p]:!text-mobile-h1 col-span-full -mt-0.75 [&_p]:text-pretty [&_p]:text-brand-w1 lg:[&_p]:!text-h1">
        <RichText>
          {data.pages.services.ventures.content?.json.content}
        </RichText>
      </div>
    </div>
  )
}
