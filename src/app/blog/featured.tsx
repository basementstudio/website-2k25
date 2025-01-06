import { RichText } from "basehub/react-rich-text"

import { QueryType } from "./query"

export default function Featured({ data }: { data: QueryType }) {
  const posts = data.pages.blog.posts.items.sort(
    (a, b) =>
      new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
  )

  const featuredPosts = [...posts].slice(0, 2)

  return (
    <section className="grid-layout">
      <h2 className="col-start-1 col-end-3 mb-3 text-subheading capitalize text-brand-w2">
        latest news
      </h2>
      {featuredPosts.map((post, key) => (
        <div key={post._slug} className="col-span-12 grid grid-cols-12 gap-2">
          <div className="col-span-3 aspect-video bg-brand-g2" />
          <h2 className="col-start-5 col-end-8 text-subheading text-brand-w2">
            {post._title}
          </h2>
          <div className="relative col-span-4 col-start-9 grid grid-cols-4 content-start gap-y-2">
            <div className="col-start-1 col-end-4 block text-paragraph text-brand-w2">
              <RichText content={post.intro?.json.content} />
            </div>
            <hr className="col-start-1 col-end-5 mt-2 w-full border-brand-w1/20" />
            <div className="col-span-2 col-start-1 flex gap-1">
              <p className="h-max w-max bg-brand-g2 px-1 text-paragraph text-brand-w2">
                Development
              </p>
              <p className="h-max w-max bg-brand-g2 px-1 text-paragraph text-brand-w2">
                Web Design
              </p>
            </div>
            <p className="col-span-2 col-start-3 text-paragraph text-brand-w2">
              {new Date(post.date || "").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </p>
          </div>
        </div>
      ))}
    </section>
  )
}
