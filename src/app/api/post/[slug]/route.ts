import * as Sentry from "@sentry/nextjs"
import { NextResponse } from "next/server"

import {
  fetchPostBySlug,
  fetchRelatedPostsForMarkdown
} from "@/app/(site)/(plain)/(content)/post/[slug]/sanity"
import { SITE_URL } from "@/lib/constants"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params

  // Only the `.md` form is served here; the proxy rewrites to this route.
  if (!rawSlug.endsWith(".md"))
    return new NextResponse(null, { status: 404, headers: MD_HEADERS })
  const slug = rawSlug.slice(0, -3)

  try {
    const post = await fetchPostBySlug(slug, { published: true })
    if (!post) {
      return new NextResponse("# 404 Not Found\n", {
        status: 404,
        headers: MD_HEADERS
      })
    }

    const relatedPosts = await fetchRelatedPostsForMarkdown(
      slug,
      post.categories?.map((c) => c.title) ?? []
    )

    const parts: Array<string | null> = [
      `# ${post.title}`,
      "",
      post.authors?.length
        ? `**Author:** ${post.authors.map((a) => a.title).join(", ")}`
        : null,
      post.date
        ? `**Published:** ${new Date(post.date).toLocaleDateString()}`
        : null,
      post.categories?.length
        ? `**Categories:** ${post.categories.map((c) => c.title).join(", ")}`
        : null,
      "",
      "---",
      "",
      portableTextToMarkdown(post.intro, { baseUrl: SITE_URL }),
      "",
      portableTextToMarkdown(post.content, { baseUrl: SITE_URL }),
      "",
      relatedPosts.length ? "## Related Posts" : null,
      relatedPosts.length ? "" : null,
      relatedPosts.length
        ? relatedPosts
            .map((related) => {
              const link = `[${related.title}](${SITE_URL}/post/${related.slug}.md)`
              const date = related.date ? related.date.split("T")[0] : null
              return date ? `- ${link} — ${date}` : `- ${link}`
            })
            .join("\n")
        : null,
      relatedPosts.length ? "" : null,
      "---",
      "",
      `[View all content](${SITE_URL}/sitemap.md)`
    ]

    const markdown = parts.filter((part) => part !== null).join("\n")

    return new NextResponse(markdown, {
      headers: {
        ...MD_HEADERS,
        Link: `<${SITE_URL}/post/${slug}>; rel="canonical"`
      }
    })
  } catch (error) {
    console.error("Error building post markdown:", error)
    Sentry.captureException(error)
    return new NextResponse("# 500 Error\n\nFailed to build markdown.", {
      status: 500,
      headers: MD_HEADERS
    })
  }
}
