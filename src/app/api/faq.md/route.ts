import { NextResponse } from "next/server"

import { fetchFaqPage } from "@/app/(site)/(plain)/(content)/faq/sanity"
import { SITE_URL } from "@/lib/constants"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

export async function GET() {
  const faq = await fetchFaqPage({ published: true })

  if (!faq?.entries.length) {
    return new NextResponse("# 404 Not Found\n", {
      status: 404,
      headers: MD_HEADERS
    })
  }

  const body = faq.entries.flatMap((entry) => [
    `## ${entry.question}`,
    "",
    entry.answer,
    ""
  ])

  const parts = [
    "# FAQ",
    "",
    faq.intro,
    faq.intro ? "" : null,
    "---",
    "",
    ...body,
    "---",
    "",
    `[View all content](${SITE_URL}/sitemap.md)`
  ]

  const markdown = parts.filter((part) => part !== null).join("\n")

  return new NextResponse(markdown, {
    headers: {
      ...MD_HEADERS,
      Link: `<${SITE_URL}/faq>; rel="canonical"`
    }
  })
}
