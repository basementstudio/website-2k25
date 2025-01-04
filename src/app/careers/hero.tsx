import { QueryType } from "./careers-query"

export const Hero = ({ data }: { data?: QueryType }) => {
  console.log(data)
  return (
    <section
      className="grid-layout -mb-11 text-brand-w2"
      aria-labelledby="careers-heading"
    >
      <h1 className="col-start-1 col-end-5 text-heading uppercase">
        {data?.pages.careers.title}
      </h1>
      <p className="col-start-5 col-end-9 max-w-[555px] text-subheading">
        {data?.pages.careers.subheading1}
      </p>
      <p className="col-start-9 col-end-13 max-w-[555px] text-subheading">
        {data?.pages.careers.subheading2}
      </p>
    </section>
  )
}
