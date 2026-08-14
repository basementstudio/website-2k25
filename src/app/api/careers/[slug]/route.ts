import * as Sentry from "@sentry/nextjs"
import { NextResponse } from "next/server"

import { fetchCareerPosition } from "@/app/(site)/(plain)/(content)/careers/[slug]/sanity"
import { SITE_URL } from "@/lib/constants"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params

  // Only the `.md` form is served here; the proxy rewrites to this route.
  if (!rawSlug.endsWith(".md"))
    return new NextResponse(null, { status: 404, headers: MD_HEADERS })
  const slug = rawSlug.slice(0, -3)

  try {
    const position = await fetchCareerPosition(slug, { published: true })
    // Closed positions 404 here too, mirroring the HTML page's `notFound()`.
    if (!position || !position.isOpen) {
      return new NextResponse("# 404 Not Found\n", {
        status: 404,
        headers: MD_HEADERS
      })
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

    return new NextResponse(markdown, {
      headers: {
        ...MD_HEADERS,
        Link: `<${SITE_URL}/careers/${slug}>; rel="canonical"`
      }
    })
  } catch (error) {
    console.error("Error building career position markdown:", error)
    Sentry.captureException(error)
    return new NextResponse("# 500 Error\n\nFailed to build markdown.", {
      status: 500,
      headers: MD_HEADERS
    })
  }
}
