import type { Metadata } from "next"
import { toPlainText } from "next-sanity"

import {
  fetchCategoriesNonEmpty,
  fetchFeaturedPost,
  fetchPostCount,
  fetchPostsForArchive,
  type PostArchiveEntry
} from "@/app/(site)/(canvas)/(content)/blog/sanity"
import { Field, linkClass, Section } from "@/app/ai/components"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"
import { truncateDescription } from "@/utils/seo"

export const metadata: Metadata = {
  title: "Blog machine view",
  description:
    "Plain-text index of every basement.studio blog post for AI agents, crawlers, and humans who prefer it raw.",
  // The human blog is the canonical index; this page is a styled mirror.
  alternates: { canonical: "https://basement.studio/blog" }
}

const MachineBlogPage = async () => {
  const [featuredPost, posts, total, categories] = await Promise.all([
    fetchFeaturedPost(),
    fetchPostsForArchive(),
    fetchPostCount(),
    fetchCategoriesNonEmpty()
  ])

  // fetchPostsForArchive skips the newest post (rendered separately as
  // featured) — merge it back in here.
  const allPosts: PostArchiveEntry[] = [
    featuredPost
      ? {
          _id: featuredPost._id,
          title: featuredPost.title,
          slug: featuredPost.slug,
          date: featuredPost.date,
          categories: featuredPost.categories
        }
      : null,
    ...posts
  ].filter((post): post is PostArchiveEntry => post !== null)

  const excerpt = featuredPost?.intro?.length
    ? truncateDescription(toPlainText(featuredPost.intro))
    : ""

  return (
    <>
      <PageJsonLd />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-24 pt-12 text-f-p-mobile uppercase text-machine-base lg:text-f-p">
        <header className="flex flex-col gap-4">
          <nav
            aria-label="Machine index"
            className="flex flex-wrap gap-x-4 gap-y-1"
          >
            <a href="/ai" className={linkClass}>
              /ai
            </a>
            <span className="text-machine-dim">::</span>
            <span className="text-machine-dim">blog</span>
          </nav>
          <h1 className="text-machine-bright">basement.studio :: blog index</h1>
          <p className="text-machine-dim">
            # every post from the basement blog, machine-readable. append .md to
            any post url for raw markdown.
          </p>
          <dl className="flex flex-col gap-1">
            <Field label="posts">{total}</Field>
            {categories.length ? (
              <Field label="categories">
                {categories.map((category) => `[${category.title}]`).join(" ")}
              </Field>
            ) : null}
            <Field label="human">
              <a href="/blog" className={linkClass}>
                /blog
              </a>
            </Field>
          </dl>
        </header>

        {featuredPost ? (
          <Section title="featured">
            <p>
              {featuredPost.date ? (
                <span className="text-machine-dim">
                  {featuredPost.date.split("T")[0]}{" "}
                </span>
              ) : null}
              <a href={`/ai/post/${featuredPost.slug}`} className={linkClass}>
                {featuredPost.title}
              </a>
            </p>
            {excerpt ? <p>{excerpt}</p> : null}
          </Section>
        ) : null}

        <Section title="all_writing">
          <ul className="flex flex-col gap-1">
            {allPosts.map((post) => (
              <li key={post._id}>
                {"- "}
                {post.date ? (
                  <span className="text-machine-dim">
                    {post.date.split("T")[0]}{" "}
                  </span>
                ) : null}
                <a href={`/ai/post/${post.slug}`} className={linkClass}>
                  {post.title}
                </a>
                {post.categories?.length ? (
                  <span className="text-machine-dim">
                    {" "}
                    {post.categories
                      .map((category) => `[${category.title}]`)
                      .join(" ")}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>

        <footer className="flex flex-col gap-1 text-machine-dim">
          <p>
            <a href="/ai" className={linkClass}>
              back to machine index
            </a>{" "}
            ·{" "}
            <a href="/blog" className={linkClass}>
              read as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </main>
    </>
  )
}

export default MachineBlogPage
