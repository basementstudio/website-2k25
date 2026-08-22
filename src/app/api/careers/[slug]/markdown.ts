import { cacheLife } from "next/cache"

import { fetchCareerPosition } from "@/app/(site)/(plain)/(content)/careers/[slug]/sanity"
import { SITE_URL } from "@/lib/constants"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"

export async function buildCareerMarkdown(
  slug: string
): Promise<{ markdown: string; status: 200 | 404 }> {
  "use cache"
  const position = await fetchCareerPosition(slug, { published: true })
  // Closed positions 404 here too, mirroring the HTML page's `notFound()`.
  if (!position) {
    cacheLife("hours")
    return { markdown: "# 404 Not Found\n", status: 404 }
  }
  if (!position.isOpen) {
    return { markdown: "# 404 Not Found\n", status: 404 }
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
