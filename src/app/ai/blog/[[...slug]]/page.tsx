import type { Metadata } from "next"
import { toPlainText } from "next-sanity"

import {
  fetchCategoriesNonEmpty,
  fetchFeaturedPost,
  fetchPostCount,
  fetchPosts,
  fetchPostsForArchive,
  type PostArchiveEntry
} from "@/app/(site)/(canvas)/(content)/blog/sanity"
import { Field, linkClass, Section } from "@/app/ai/components"
import { MachineHeader } from "@/app/ai/machine-header"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"
import { truncateDescription } from "@/utils/seo"

type Params = Promise<{ slug: string[] }>

const INDEX_METADATA: Metadata = {
  title: "Blog machine view",
  description:
    "Plain-text index of every basement.studio blog post for AI agents, crawlers, and humans who prefer it raw.",
  // The human blog is the canonical index; this page is a styled mirror.
  alternates: { canonical: "https://basement.studio/blog" }
}

export const generateMetadata = async (props: {
  params: Params
}): Promise<Metadata> => {
  const { slug } = await props.params
  const categorySlug = slug?.[0]

  if (!categorySlug) return INDEX_METADATA

  const categories = await fetchCategoriesNonEmpty()
  const category = categories.find((c) => c.slug === categorySlug)

  // Unknown category or extra segments still render, mirroring the human
  // blog's frozen HTML — stop them from self-canonicalizing as distinct,
  // indexable URLs.
  if (!category || slug.length > 1) {
    return { ...INDEX_METADATA, robots: { index: false } }
  }

  return {
    title: "Blog machine view",
    description: `Plain-text index of basement.studio's ${category.title} blog posts for AI agents, crawlers, and humans who prefer it raw.`,
    // The human category page is the canonical index; this page is a styled mirror.
    alternates: { canonical: `https://basement.studio/blog/${categorySlug}` }
  }
}

const MachineBlogCategoryPage = async ({
  categorySlug
}: {
  categorySlug: string
}) => {
  const [{ posts, total }, categories] = await Promise.all([
    fetchPosts(categorySlug),
    fetchCategoriesNonEmpty()
  ])

  const category = categories.find((c) => c.slug === categorySlug)
  const title = category?.title ?? categorySlug

  return (
    <>
      <PageJsonLd />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-24 pt-12 text-f-p-mobile uppercase text-machine-base lg:text-f-p">
        <header className="flex flex-col gap-4">
          <MachineHeader current="/ai/blog" />
          <h1 className="text-machine-bright">
            basement.studio :: blog :: {title}
          </h1>
          <p className="text-machine-dim">
            # posts filed under [{title}], machine-readable. append .md to any
            post url for raw markdown.
          </p>
          <dl className="flex flex-col gap-1">
            <Field label="posts">{total}</Field>
            <Field label="all_posts">
              <a href="/ai/blog" className={linkClass}>
                /ai/blog
              </a>
            </Field>
            <Field label="human">
              <a href={`/blog/${categorySlug}`} className={linkClass}>
                /blog/{categorySlug}
              </a>
            </Field>
          </dl>
        </header>

        <Section title="posts">
          {posts.length ? (
            <ul className="flex flex-col gap-1">
              {posts.map((post) => (
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
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-machine-dim"># no posts in this category</p>
          )}
        </Section>

        <footer className="flex flex-col gap-1 text-machine-dim">
          <p>
            <a href="/ai/home" className={linkClass}>
              back to machine index
            </a>{" "}
            ·{" "}
            <a href="/ai/blog" className={linkClass}>
              all writing
            </a>{" "}
            ·{" "}
            <a href={`/blog/${categorySlug}`} className={linkClass}>
              read as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </main>
    </>
  )
}

const MachineBlogIndexPage = async () => {
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
          <MachineHeader current="/ai/blog" />
          <h1 className="text-machine-bright">basement.studio :: blog index</h1>
          <p className="text-machine-dim">
            # every post from the basement blog, machine-readable. append .md to
            any post url for raw markdown.
          </p>
          <dl className="flex flex-col gap-1">
            <Field label="posts">{total}</Field>
            {categories.length ? (
              <Field label="categories">
                {categories.map((category, i) => (
                  <span key={category.slug}>
                    {i > 0 ? " " : null}
                    <a href={`/ai/blog/${category.slug}`} className={linkClass}>
                      [{category.title}]
                    </a>
                  </span>
                ))}
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
            <a href="/ai/home" className={linkClass}>
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

const MachineBlogPage = async (props: { params: Params }) => {
  const { slug } = await props.params
  const categorySlug = slug?.[0]

  if (categorySlug) {
    return <MachineBlogCategoryPage categorySlug={categorySlug} />
  }

  return <MachineBlogIndexPage />
}

export default MachineBlogPage

export const generateStaticParams = async () => {
  const categories = await fetchCategoriesNonEmpty({ forStaticParams: true })

  return [
    { slug: [] },
    ...categories.map((category) => ({ slug: [category.slug] }))
  ]
}
