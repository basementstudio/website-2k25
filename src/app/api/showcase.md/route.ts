import { NextResponse } from "next/server"

import { fetchShowcaseListForMarkdown } from "@/app/(site)/(pages)/showcase/sanity"
import { SITE_URL } from "@/lib/constants"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

export async function GET() {
  try {
    const projects = await fetchShowcaseListForMarkdown()

    const list = projects
      .map((project) => {
        const detail = [project.client, project.year].filter(Boolean).join(", ")
        const link = `[${project.title}](${SITE_URL}/showcase/${project.slug}.md)`
        return detail ? `- ${link} — ${detail}` : `- ${link}`
      })
      .join("\n")

    const parts: Array<string | null> = [
      "# Showcase",
      "",
      "Selected projects by basement.studio.",
      list ? "" : null,
      list || null,
      "",
      "---",
      "",
      `[View all content](${SITE_URL}/sitemap.md)`
    ]

    const markdown = parts.filter((part) => part !== null).join("\n")

    return new NextResponse(markdown, { headers: MD_HEADERS })
  } catch (error) {
    console.error("Error building showcase markdown:", error)
    return new NextResponse("# 500 Error\n\nFailed to build markdown.", {
      status: 500,
      headers: MD_HEADERS
    })
  }
}
