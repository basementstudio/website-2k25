import { RichText } from "@/components/primitives/rich-text"

import { QueryType } from "./query"

export const VenturesBanner = ({ data }: { data: QueryType }) => {
  console.dir(data.pages.services.ventures.content?.json.content, {
    depth: null
  })

  return (
    <div className="grid-layout">
      <h2 className="col-start-3 col-end-6 text-h2 text-brand-g1">
        {data.pages.services.ventures.title}
      </h2>

      <div className="col-start-1 col-end-13 -mt-0.75 [&_p]:text-pretty [&_p]:text-h1 [&_p]:text-brand-w1">
        <RichText>
          {data.pages.services.ventures.content?.json.content}
        </RichText>
      </div>
    </div>
  )
}
