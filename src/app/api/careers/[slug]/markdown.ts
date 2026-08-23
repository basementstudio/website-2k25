import { cacheLife } from "next/cache"

import { fetchCareerPosition } from "@/app/(site)/(plain)/(content)/careers/[slug]/sanity"
import { SITE_URL } from "@/lib/constants"
import {
  type MarkdownResult,
  NOT_FOUND_MARKDOWN
} from "@/service/markdown/document"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"

export async function buildCareerMarkdown(
  slug: string
): Promise<MarkdownResult> {
  "use cache"
  const position = await fetchCareerPosition(slug, { published: true })
  // A missing doc has no Sanity tag to invalidate its 404, so cap it; a closed
  // one does. Both 404, mirroring the HTML page's `notFound()`.
  if (!position) cacheLife("hours")
  if (!position?.isOpen) {
    return { markdown: NOT_FOUND_MARKDOWN, status: 404 }
  }

  const skills = position.applyFormSetup?.skills
    ?.map((s) => s.title)
    .filter(Boolean)

  const parts: Array<string | null> = [
    `# ${position.title}`,
    "",
    position.type ? `**Type:** ${position.type}` : null,
    position.employmentType
      ? `**Employment Type:** ${position.employmentType}`
      : null,
    position.location ? `**Location:** ${position.location}` : null,
    position.applyUrl ? `**Apply:** ${position.applyUrl}` : null,
    skills?.length ? `**Skills:** ${skills.join(", ")}` : null,
    "",
    "---",
    "",
    portableTextToMarkdown(position.jobDescription, { baseUrl: SITE_URL }),
    "",
    "---",
    "",
    `[View all content](${SITE_URL}/sitemap.md)`
  ]

  const markdown = parts.filter((part) => part !== null).join("\n")
  return { markdown, status: 200 }
}
