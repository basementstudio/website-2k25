import { QueryType } from "./query"

export const Hero = ({ data }: { data: QueryType }) => (
  <section className="grid-layout">
    <h1 className="col-start-1 col-end-7 text-h1 text-brand-w2">Showcase</h1>

    <div className="col-start-7 col-end-12 text-h1 text-brand-g1">
      {data.pages.showcase.projectList.items.length}
    </div>
  </section>
)
