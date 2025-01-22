import { RichText } from "basehub/react-rich-text"

import { QueryType } from "./query"

export const VenturesBanner = ({ data }: { data: QueryType }) => {
  return (
    <div className="grid-layout">
      <h2 className="col-start-3 col-end-6 text-h2 text-brand-w2">
        {data.pages.services.ventures.title}
      </h2>

      <div className="col-start-1 col-end-12 text-h1 text-brand-w1">
        <RichText>
          {data.pages.services.ventures.content?.json.content}
        </RichText>
      </div>
    </div>
  )
}
