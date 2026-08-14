import { NextResponse } from "next/server"

import { fetchFaqPage } from "@/app/(site)/(plain)/(content)/faq/sanity"
import { SITE_URL } from "@/lib/constants"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

export async function GET() {
  const { intro, entries } = await fetchFaqPage({ published: true })

  const body = entries.flatMap((faq) => [
    `## ${faq.question}`,
    "",
    faq.answer,
    ""
  ])

  const markdown = [
    "# FAQ",
    "",
    intro,
    "",
    "---",
    "",
    ...body,
    "---",
    "",
    `[View all content](${SITE_URL}/sitemap.md)`
  ].join("\n")

  return new NextResponse(markdown, {
    headers: {
      ...MD_HEADERS,
      Link: `<${SITE_URL}/faq>; rel="canonical"`
    }
  })
}
