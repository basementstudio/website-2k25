import { NextResponse } from "next/server"

import { SITE_URL } from "@/lib/constants"
import { FAQ_ENTRIES, FAQ_INTRO } from "@/lib/faq"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

export function GET() {
  const entries = FAQ_ENTRIES.flatMap((faq) => [
    `## ${faq.question}`,
    "",
    faq.answer,
    ""
  ])

  const markdown = [
    "# FAQ",
    "",
    FAQ_INTRO,
    "",
    "---",
    "",
    ...entries,
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
