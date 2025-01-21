import { RichText } from "basehub/react-rich-text"

import { QueryType } from "./careers-query"

export const Hero = ({ data }: { data?: QueryType }) => {
  return (
    <section
      className="grid-layout mb-[180px] text-brand-w2"
      aria-labelledby="careers-heading"
    >
      <h1 className="col-start-1 col-end-5 text-heading uppercase">
        {data?.pages.careers.title}
      </h1>
      <div className="col-start-5 col-end-9 max-w-[34.6875rem] text-subheading">
        <RichText
          content={data?.pages?.careers?.subheading1?.json?.content ?? []}
        />
      </div>
      <div className="col-start-9 col-end-13 max-w-[34.6875rem] text-subheading">
        <RichText
          content={data?.pages?.careers?.subheading2?.json?.content ?? []}
        />
      </div>
    </section>
  )
}
