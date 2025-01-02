import { QueryType } from "./query"

export const Hero = ({ data }: { data: QueryType }) => (
  <section className="grid-layout text-heading uppercase">
    <h1 className="col-start-1 col-end-5 text-brand-w2">Projects</h1>
    <div className="col-start-5 col-end-12 text-brand-g1">
      {data.pages.projects.projectList.items.length}
    </div>
  </section>
)
