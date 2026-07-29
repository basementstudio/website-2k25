import { NextResponse } from "next/server"

import { fetchServicesPage } from "@/app/(site)/(canvas)/(content)/services/sanity"
import { SITE_URL } from "@/lib/constants"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

export async function GET() {
  try {
    const services = await fetchServicesPage({ published: true })
    if (!services) {
      return new NextResponse("# 404 Not Found\n", {
        status: 404,
        headers: MD_HEADERS
      })
    }

    const serviceCategories = services.serviceCategories?.length
      ? services.serviceCategories
          .map((cat) =>
            [
              `### ${cat.title}`,
              "",
              portableTextToMarkdown(cat.description, { baseUrl: SITE_URL })
            ]
              .filter(Boolean)
              .join("\n")
          )
          .join("\n\n")
      : null

    const ventures = services.ventures?.length
      ? services.ventures
          .map((venture) =>
            [
              `### ${venture.title}`,
              "",
              portableTextToMarkdown(venture.content, { baseUrl: SITE_URL })
            ]
              .filter(Boolean)
              .join("\n")
          )
          .join("\n\n")
      : null

    const parts: Array<string | null> = [
      "# Services",
      "",
      portableTextToMarkdown(services.intro, { baseUrl: SITE_URL }) || null,
      "",
      "---",
      "",
      serviceCategories ? "## What We Offer" : null,
      serviceCategories ? "" : null,
      serviceCategories,
      serviceCategories ? "" : null,
      ventures ? "## Ventures" : null,
      ventures ? "" : null,
      ventures,
      "",
      "---",
      "",
      `[View all content](${SITE_URL}/sitemap.md)`
    ]

    const markdown = parts.filter((part) => part !== null).join("\n")

    return new NextResponse(markdown, { headers: MD_HEADERS })
  } catch (error) {
    console.error("Error building services markdown:", error)
    return new NextResponse("# 500 Error\n\nFailed to build markdown.", {
      status: 500,
      headers: MD_HEADERS
    })
  }
}
