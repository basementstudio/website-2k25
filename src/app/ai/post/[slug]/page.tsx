import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  fetchAllPostSlugs,
  fetchPostMeta,
  getPostData
} from "@/app/(site)/(plain)/(content)/post/[slug]/sanity"
import { Field, linkClass, MachineLink, Section } from "@/app/ai/components"
import { MachinePortableText } from "@/app/ai/machine-portable-text"
import { extractPlainText } from "@/lib/structured-data/extract-text"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"
import { truncateDescription } from "@/utils/seo"

interface MachinePostProps {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({
  params
}: MachinePostProps): Promise<Metadata | null> => {
  const { slug } = await params
  const post = await fetchPostMeta(slug)

  if (!post) return null

  return {
    title: { absolute: `${post.title ?? "Untitled"} | Machine view` },
    description:
      truncateDescription(extractPlainText(post.intro)) ||
      `Machine-readable mirror of ${post.title ?? "a post"} from the basement.studio blog.`,
    // The human post is the canonical document; this page is a styled mirror.
    alternates: { canonical: `https://basement.studio/post/${slug}` }
  }
}

const MachinePostPage = async ({ params }: MachinePostProps) => {
  const { slug } = await params
  const data = await getPostData(slug)

  if (!data) return notFound()

  const { post, relatedPosts } = data

  return (
    <>
      <PageJsonLd />
      {/* Header/meta stay uppercase like the /ai index; the article body keeps
        its authored casing for readability. */}
      <header className="flex flex-col gap-4 uppercase">
        <h1 className="text-machine-bright">{post.title}</h1>
        <dl className="flex flex-col gap-1">
          {post.date ? (
            <Field label="published">{post.date.split("T")[0]}</Field>
          ) : null}
          {post.authors?.length ? (
            <Field label="authors">
              {post.authors.map((author) => author.title).join(", ")}
            </Field>
          ) : null}
          {post.categories?.length ? (
            <Field label="tags">
              {post.categories
                .map((category) => `[${category.title}]`)
                .join(" ")}
            </Field>
          ) : null}
          <Field label="markdown">
            <a href={`/post/${post.slug}.md`} className={linkClass}>
              /post/{post.slug}.md
            </a>
          </Field>
          <Field label="human">
            <a href={`/post/${post.slug}`} className={linkClass}>
              /post/{post.slug}
            </a>
          </Field>
        </dl>
      </header>

      <Section title="post">
        <article className="flex flex-col gap-4">
          <MachinePortableText blocks={post.intro} />
          <MachinePortableText blocks={post.content} />
        </article>
      </Section>

      {relatedPosts.length ? (
        <Section title="related_writing">
          <ul className="flex flex-col gap-1 uppercase">
            {relatedPosts.map((related) => (
              <li key={related._id}>
                {"- "}
                {related.date ? (
                  <span className="text-machine-dim">
                    {related.date.split("T")[0]}{" "}
                  </span>
                ) : null}
                <MachineLink href={`/ai/post/${related.slug}`}>
                  {related.title}
                </MachineLink>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <footer className="flex flex-col gap-1 uppercase text-machine-dim">
        <p>
          <MachineLink href="/ai/home">back to machine index</MachineLink> ·{" "}
          <MachineLink href="/ai/blog">all writing</MachineLink> ·{" "}
          <a href={`/post/${post.slug}`} className={linkClass}>
            read as human
          </a>
        </p>
        <p>/* EOF */</p>
      </footer>
    </>
  )
}

export default MachinePostPage

export async function generateStaticParams() {
  const slugs = await fetchAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}
