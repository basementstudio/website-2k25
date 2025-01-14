import { QueryType } from "./query"

export default function Hero({ data }: { data: QueryType }) {
  return (
    <section className="grid-layout text-heading uppercase">
      <h1 className="col-start-1 col-end-5 text-brand-w2">Blog</h1>
      <p className="col-span-1 col-start-5 text-brand-g1">
        {data.pages.blog.posts.items.length}
      </p>
    </section>
  )
}
