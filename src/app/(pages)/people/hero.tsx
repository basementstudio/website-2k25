import { RichText } from "@/components/primitives/rich-text"

import { QueryType } from "./careers-query"

export const Hero = ({ data }: { data?: QueryType }) => {
  return (
    <section
      className="grid-layout mb-44 text-brand-w2"
      aria-labelledby="careers-heading"
    >
      <h1 className="col-start-1 col-end-5 text-h1">
        {data?.pages.people._title}
      </h1>
      <div className="col-start-5 col-end-9 flex max-w-[34.6875rem] flex-col gap-4 [&_p]:text-pretty [&_p]:text-h2">
        <RichText>{data?.pages.people.subheading1?.json.content}</RichText>
      </div>
      <div className="col-start-9 col-end-13 flex max-w-[34.6875rem] flex-col gap-4 [&_p]:text-pretty [&_p]:text-h2">
        <RichText>{data?.pages.people.subheading2?.json.content}</RichText>
      </div>
    </section>
  )
}
