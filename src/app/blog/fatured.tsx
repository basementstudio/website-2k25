import { QueryType } from "./query"

export default function Featured({ data }: { data: QueryType }) {
  const featuredPosts = data.pages.blog.posts.items.slice(0, 2)
  return (
    <section className="grid-layout">
      <p className="col-start-1 col-end-3 text-subheading capitalize text-brand-w2">
        latest news
      </p>
      <div className="col-start-1 col-end-12">
        {featuredPosts.map((post, key) => (
          <div key={post._slug}>
            <h2>{post._title}</h2>
          </div>
        ))}
      </div>
    </section>
  )
}
