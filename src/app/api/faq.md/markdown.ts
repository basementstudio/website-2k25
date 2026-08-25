import { cacheLife } from "next/cache"
import { stegaClean } from "next-sanity"

import { fetchFaqPage } from "@/app/(site)/(plain)/(content)/faq/sanity"
import { SITE_URL } from "@/lib/constants"
import {
  type MarkdownResult,
  NOT_FOUND_MARKDOWN
} from "@/service/markdown/document"

export async function buildFaqMarkdown(): Promise<MarkdownResult> {
  "use cache"
  // fetchFaqPage is draft-aware (no published pin) — clean any stega chars a
  // draft-mode editor's cookie would inject into this crawler-facing output.
  const faq = stegaClean(await fetchFaqPage())

  if (!faq?.entries.length) {
    cacheLife("hours")
    return { markdown: NOT_FOUND_MARKDOWN, status: 404 }
  }

  const body = faq.entries.flatMap((entry) => [
    `## ${entry.question}`,
    "",
    entry.answer,
    ""
  ])

  const parts = [
    `# ${faq.heading || "FAQ"}`,
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
  return { markdown, status: 200 }
}
