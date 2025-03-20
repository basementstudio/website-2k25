import { RichText } from "@/components/primitives/rich-text"

import { QueryType } from "./query"

export const VenturesBanner = ({ data }: { data: QueryType }) => (
  <div className="grid-layout">
    <h2 className="text-f-h3-mobile lg:text-f-h3 col-span-full text-brand-g1 lg:col-start-3 lg:col-end-6">
      {data.pages.services.ventures.title}
    </h2>

    <div className="first:[&_p]:text-brt-0.75 col-span-full -mt-0.75 [&_p]:!text-f-h1-mobile lg:[&_p]:!text-f-h1">
      <RichText components={{ a: CtaTargetBlank }}>
        {data.pages.services.ventures.content?.json.content}
      </RichText>
    </div>
  </div>
)

const CtaTargetBlank = (props: any) => {
  return <a {...props} target="_blank" rel="noopener noreferrer" />
}
