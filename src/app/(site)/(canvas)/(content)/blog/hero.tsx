import { fetchPostCount } from "./sanity"

export async function Hero() {
  const length = await fetchPostCount()

  return (
    <section className="grid-layout text-f-h0-mobile lg:text-f-h0">
      <h1 className="col-span-3 text-brand-w2 lg:col-start-1 lg:col-end-5">
        Blog
      </h1>
      <p className="col-span-1 text-end text-brand-g1 lg:col-start-5 lg:text-start">
        {length}
      </p>
    </section>
  )
}
