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
      <h1 className="lg:text-f-h0 text-f-h0-mobile col-span-3 text-brand-w2 lg:col-start-1 lg:col-end-7">
        Showcase
      </h1>
      <div className="lg:text-f-h0 text-f-h0-mobile col-span-1 text-brand-g1 lg:col-start-7 lg:col-end-12">
        {length}
      </div>
    </section>
  )
}
