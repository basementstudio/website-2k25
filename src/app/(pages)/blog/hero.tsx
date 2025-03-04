import { QueryType } from "./query"

export default function Hero({ data }: { data: QueryType }) {
  return (
    <section className="grid-layout text-mobile-h1 lg:text-h1">
      <h1 className="col-span-3 text-brand-w2 lg:col-start-1 lg:col-end-5">
        Blog
      </h1>
      <p className="col-span-1 text-brand-g1 lg:col-start-5">
        {data.pages.blog.posts.items.length}
      </p>
    </section>
  )
}
