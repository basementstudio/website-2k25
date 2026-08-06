import { NextResponse } from "next/server"

import { fetchAllOpenPositionsForIndex } from "@/app/(site)/(plain)/(content)/careers/[slug]/sanity"
import { fetchAllPostsForIndex } from "@/app/(site)/(plain)/(content)/post/[slug]/sanity"
import { fetchAllProjectsForIndex } from "@/app/(site)/(plain)/(content)/showcase/[slug]/sanity"
import { SITE_URL } from "@/lib/constants"

export async function GET() {
  try {
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
      `- [FAQ](${SITE_URL}/faq.md)`,
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

    return new NextResponse(parts.join("\n"), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
        "X-Content-Type-Options": "nosniff"
      }
    })
  } catch (error) {
    console.error("Error building markdown sitemap:", error)
    return new NextResponse("# 500 Error\n\nFailed to build content index.", {
      status: 500,
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    })
  }
}
