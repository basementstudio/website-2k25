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
import { Field, linkClass, MachineLink, Section } from "@/app/ai/components"
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
      {/* display:contents keeps the sections in the template's flex gap while
        cascading the index's uppercase styling. */}
      <div className="contents uppercase">
        <header className="flex flex-col gap-4">
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
              <MachineLink href="/ai/blog">/ai/blog</MachineLink>
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
                  <MachineLink href={`/ai/post/${post.slug}`}>
                    {post.title}
                  </MachineLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-machine-dim"># no posts in this category</p>
          )}
        </Section>

        <footer className="flex flex-col gap-1 text-machine-dim">
          <p>
            <MachineLink href="/ai/home">back to machine index</MachineLink> ·{" "}
            <MachineLink href="/ai/blog">all writing</MachineLink> ·{" "}
            <a href={`/blog/${categorySlug}`} className={linkClass}>
              read as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </div>
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
      {/* display:contents keeps the sections in the template's flex gap while
        cascading the index's uppercase styling. */}
      <div className="contents uppercase">
        <header className="flex flex-col gap-4">
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
                    <MachineLink href={`/ai/blog/${category.slug}`}>
                      [{category.title}]
                    </MachineLink>
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
              <MachineLink href={`/ai/post/${featuredPost.slug}`}>
                {featuredPost.title}
              </MachineLink>
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
                <MachineLink href={`/ai/post/${post.slug}`}>
                  {post.title}
                </MachineLink>
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
            <MachineLink href="/ai/home">back to machine index</MachineLink> ·{" "}
            <a href="/blog" className={linkClass}>
              read as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </div>
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
