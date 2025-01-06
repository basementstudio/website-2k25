import { QueryType } from "./query"

export default function BlogList({ data }: { data: QueryType }) {
  return (
    <section className="grid-layout">
      <h1 className="col-start-1 col-end-5 text-subheading capitalize text-brand-w2">
        more news
      </h1>
    </section>
  )
}
