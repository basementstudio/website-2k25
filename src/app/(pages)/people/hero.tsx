import { RichText } from "@/components/primitives/rich-text"

import { QueryType } from "./careers-query"

export const Hero = ({ data }: { data?: QueryType }) => {
  return (
    <section
      className="grid-layout mb-44 !gap-y-6 text-brand-w2 lg:!gap-y-2"
      aria-labelledby="careers-heading"
    >
      <h1 className="col-span-full text-mobile-h1 lg:col-start-1 lg:col-end-5 lg:text-h1">
        {data?.pages.people._title}
      </h1>
      <div className="col-span-full flex max-w-[34.6875rem] flex-col gap-4 lg:col-start-5 lg:col-end-9 [&_p]:text-pretty [&_p]:text-mobile-h2 lg:[&_p]:text-h2">
        <RichText>{data?.pages.people.subheading1?.json.content}</RichText>
      </div>
      <div className="col-span-full flex max-w-[34.6875rem] flex-col gap-4 lg:col-start-9 lg:col-end-13 [&_p]:text-pretty [&_p]:text-mobile-h2 lg:[&_p]:text-h2">
        <RichText>{data?.pages.people.subheading2?.json.content}</RichText>
      </div>
    </section>
  )
}
