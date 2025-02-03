import { RichText } from "basehub/react-rich-text"

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
      <div className="col-start-5 col-end-9 max-w-[34.6875rem] text-h2 [&_p]:text-pretty">
        <RichText
          content={data?.pages?.people?.subheading1?.json?.content ?? []}
        />
      </div>
      <div className="col-start-9 col-end-13 max-w-[34.6875rem] text-h2 [&_p]:text-pretty">
        <RichText
          content={data?.pages?.people?.subheading2?.json?.content ?? []}
        />
      </div>
    </section>
  )
}
