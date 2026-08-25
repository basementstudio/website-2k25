import { cacheLife } from "next/cache"
import { stegaClean } from "next-sanity"

import { getPostData } from "@/app/(site)/(plain)/(content)/post/[slug]/sanity"
import { SITE_URL } from "@/lib/constants"
import {
  type MarkdownResult,
  NOT_FOUND_MARKDOWN
} from "@/service/markdown/document"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"

export async function buildPostMarkdown(slug: string): Promise<MarkdownResult> {
  "use cache"
  const data = await getPostData(slug)
  if (!data) {
    cacheLife("hours")
    return { markdown: NOT_FOUND_MARKDOWN, status: 404 }
  }
  // Draft mode leaves stega on — strip it from crawler-facing output.
  const { post, relatedPosts } = stegaClean(data)

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
  return { markdown, status: 200 }
}
