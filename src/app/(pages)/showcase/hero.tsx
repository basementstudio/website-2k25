import { client } from "@/service/basehub"

const fetchProjectsLength = async () => {
  const res = await client().query({
    pages: {
      showcase: {
        projectList: { _meta: { totalCount: true } }
      }
    }
  })

  return res.pages.showcase.projectList._meta.totalCount
}

export async function Hero() {
  const length = await fetchProjectsLength()

  return (
    <section className="grid-layout">
      <h1 className="col-span-3 text-mobile-h1 text-brand-w2 lg:col-start-1 lg:col-end-7 lg:text-h1">
        Showcase
      </h1>
      <div className="col-span-1 text-mobile-h1 text-brand-g1 lg:col-start-7 lg:col-end-12 lg:text-h1">
        {length}
      </div>
    </section>
  )
}
