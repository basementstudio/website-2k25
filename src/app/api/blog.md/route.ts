import * as Sentry from "@sentry/nextjs"
import { NextResponse } from "next/server"

import { fetchBlogIndexForMarkdown } from "@/app/(site)/(canvas)/(content)/blog/sanity"
import { SITE_URL } from "@/lib/constants"
import { truncateDescription } from "@/utils/seo"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

// CMS strings land inside `[label](url)` syntax — escape the delimiters so a
// bracketed label can't break the link.
const escapeLinkLabel = (text: string) => text.replace(/[\\[\]]/g, "\\$&")

export async function GET() {
  try {
    const { posts, categories } = await fetchBlogIndexForMarkdown()

    // Category pages have no `.md` mirror (filtered lists, no unique content)
    // — link the HTML pages.
    const categoriesLine = categories.length
      ? `**Categories:** ${categories
          .map(
            (c) => `[${escapeLinkLabel(c.title)}](${SITE_URL}/blog/${c.slug})`
          )
          .join(", ")}`
      : null

    const list = posts
      .map((post) => {
        const link = `[${escapeLinkLabel(post.title)}](${SITE_URL}/post/${post.slug}.md)`
        const date = post.date ? post.date.split("T")[0] : null
        const postCategories = post.categories?.length
          ? `(${post.categories.map((c) => c.title).join(", ")})`
          : null
        const meta = [date, postCategories].filter(Boolean).join(" ")
        const detail = [meta || null, truncateDescription(post.excerpt) || null]
          .filter(Boolean)
          .join(" — ")
        return detail ? `- ${link} — ${detail}` : `- ${link}`
      })
      .join("\n")

    const parts: Array<string | null> = [
      "# Blog",
      "",
      "Articles and writing from basement.studio.",
      "",
      categoriesLine,
      categoriesLine ? "" : null,
      list ? "## All Posts" : null,
      list ? "" : null,
      list || null,
      "",
      "---",
      "",
      `[View all content](${SITE_URL}/sitemap.md)`
    ]

    const markdown = parts.filter((part) => part !== null).join("\n")

    return new NextResponse(markdown, {
      headers: {
        ...MD_HEADERS,
        Link: `<${SITE_URL}/blog>; rel="canonical"`
      }
    })
  } catch (error) {
    console.error("Error building blog markdown:", error)
    Sentry.captureException(error)
    return new NextResponse("# 500 Error\n\nFailed to build markdown.", {
      status: 500,
      headers: MD_HEADERS
    })
  }
}
