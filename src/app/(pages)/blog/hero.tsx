import { client } from "@/service/basehub"

const fetchPostsLength = async () => {
  const res = await client().query({
    pages: {
      blog: {
        posts: { _meta: { totalCount: true } }
      }
    }
  })

  return res.pages.blog.posts._meta.totalCount
}

export async function Hero() {
  const length = await fetchPostsLength()

  return (
    <section className="grid-layout text-f-h0-mobile lg:text-f-h0">
      <h1 className="col-span-3 text-brand-w2 lg:col-start-1 lg:col-end-5">
        Blog
      </h1>
      <p className="col-span-1 text-brand-g1 lg:col-start-5">{length}</p>
    </section>
  )
}
