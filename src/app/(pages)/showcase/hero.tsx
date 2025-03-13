import { QueryType } from "./query"

export const Hero = ({ data }: { data: QueryType }) => (
  <section className="grid-layout">
    <h1 className="col-span-3 text-mobile-h1 text-brand-w2 lg:col-start-1 lg:col-end-7 lg:text-h1">
      Showcase
    </h1>

    <div className="col-span-1 text-mobile-h1 text-brand-g1 lg:col-start-7 lg:col-end-12 lg:text-h1">
      {data.pages.showcase.projectList.items.length}
    </div>
  </section>
)
