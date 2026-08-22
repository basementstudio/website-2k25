import { cacheLife } from "next/cache"

import {
  fetchPostBySlug,
  fetchRelatedPostsForMarkdown
} from "@/app/(site)/(plain)/(content)/post/[slug]/sanity"
import { SITE_URL } from "@/lib/constants"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"

export async function buildPostMarkdown(
  slug: string
): Promise<{ markdown: string; status: 200 | 404 }> {
  "use cache"
  const post = await fetchPostBySlug(slug, { published: true })
  if (!post) {
    cacheLife("hours")
    return { markdown: "# 404 Not Found\n", status: 404 }
  }

  // Sequential, not Promise.all: related posts need `post.categories`.
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
  return { markdown, status: 200 }
}
