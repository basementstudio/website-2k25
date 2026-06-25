import { NextResponse } from "next/server"

import {
  fetchOpenPositions,
  fetchPeople,
  fetchPeoplePage
} from "@/app/(site)/(pages)/people/sanity"
import { SITE_URL } from "@/lib/constants"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

export async function GET() {
  try {
    const [page, people, positions] = await Promise.all([
      fetchPeoplePage({ published: true }),
      fetchPeople({ published: true }),
      fetchOpenPositions({ published: true })
    ])

    if (!page) {
      return new NextResponse("# 404 Not Found\n", {
        status: 404,
        headers: MD_HEADERS
      })
    }

    const team = people.length
      ? people
          .map((person) => {
            const detail = [person.role, person.department?.title]
              .filter(Boolean)
              .join(", ")
            return detail
              ? `- **${person.title}** — ${detail}`
              : `- **${person.title}**`
          })
          .join("\n")
      : null

    const openPositions = positions.filter((p) => p.isOpen)
    const openPositionsList = openPositions.length
      ? openPositions
          .map((p) => {
            const detail = [p.type, p.location].filter(Boolean).join(", ")
            const link = `[${p.title}](${SITE_URL}/careers/${p.slug}.md)`
            return detail ? `- ${link} — ${detail}` : `- ${link}`
          })
          .join("\n")
      : null

    const parts: Array<string | null> = [
      `# ${page.title || "People"}`,
      "",
      portableTextToMarkdown(page.subheading1, { baseUrl: SITE_URL }) || null,
      "",
      portableTextToMarkdown(page.subheading2, { baseUrl: SITE_URL }) || null,
      "",
      "---",
      "",
      team ? "## Team" : null,
      team ? "" : null,
      team,
      team ? "" : null,
      portableTextToMarkdown(page.preOpenPositionsText, {
        baseUrl: SITE_URL
      }) || null,
      openPositionsList ? "" : null,
      openPositionsList ? "## Open Positions" : null,
      openPositionsList ? "" : null,
      openPositionsList,
      "",
      "---",
      "",
      `[View all content](${SITE_URL}/sitemap.md)`
    ]

    const markdown = parts.filter((part) => part !== null).join("\n")

    return new NextResponse(markdown, { headers: MD_HEADERS })
  } catch (error) {
    console.error("Error building people markdown:", error)
    return new NextResponse("# 500 Error\n\nFailed to build markdown.", {
      status: 500,
      headers: MD_HEADERS
    })
  }
}
