import { fetchAllOpenPositionsForIndex } from "@/app/(site)/(plain)/(content)/careers/[slug]/sanity"
import { fetchAllPostsForIndex } from "@/app/(site)/(plain)/(content)/post/[slug]/sanity"
import { fetchAllProjectsForIndex } from "@/app/(site)/(plain)/(content)/showcase/[slug]/sanity"
import { SITE_URL } from "@/lib/constants"
import type { MarkdownResult } from "@/service/markdown/document"

export async function buildSitemapMarkdown(): Promise<MarkdownResult<200>> {
  "use cache"
  const [posts, projects, positions] = await Promise.all([
    fetchAllPostsForIndex(),
    fetchAllProjectsForIndex(),
    fetchAllOpenPositionsForIndex()
  ])

  const parts: string[] = ["# basement.studio — Content Index", ""]

  parts.push(
    "## Pages",
    "",
    `- [Home](${SITE_URL}/index.md)`,
    `- [Services](${SITE_URL}/services.md)`,
    `- [People](${SITE_URL}/people.md)`,
    `- [Showcase](${SITE_URL}/showcase.md)`,
    `- [Blog](${SITE_URL}/blog.md)`,
    `- [Lab](${SITE_URL}/lab.md)`,
    `- [FAQ](${SITE_URL}/faq.md)`,
    `- [Contact](${SITE_URL}/contact.md)`,
    ""
  )

  if (posts.length > 0) {
    parts.push("## Blog Posts", "")
    for (const post of posts) {
      parts.push(`- [${post.title}](${SITE_URL}/post/${post.slug}.md)`)
    }
    parts.push("")
  }

  if (projects.length > 0) {
    parts.push("## Projects", "")
    for (const project of projects) {
      parts.push(
        `- [${project.title}](${SITE_URL}/showcase/${project.slug}.md)`
      )
    }
    parts.push("")
  }

  if (positions.length > 0) {
    parts.push("## Open Positions", "")
    for (const position of positions) {
      parts.push(
        `- [${position.title}](${SITE_URL}/careers/${position.slug}.md)`
      )
    }
    parts.push("")
  }

  parts.push(
    "## Other Resources",
    "",
    `- [Machine view](${SITE_URL}/ai/home) — plain-HTML mirror of the site; every content page has a twin at /ai/{path}`,
    `- [llms.txt](${SITE_URL}/llms.txt) — curated link map for LLMs`,
    `- [agents.md](${SITE_URL}/agents.md) — notes for AI agents and crawlers`,
    `- [XML sitemap](${SITE_URL}/sitemap.xml)`,
    `- [Basketball](${SITE_URL}/basketball) — interactive experience, HTML only`,
    `- [Doom](${SITE_URL}/doom) — interactive experience, HTML only`,
    ""
  )

  return { markdown: parts.join("\n"), status: 200 }
}
