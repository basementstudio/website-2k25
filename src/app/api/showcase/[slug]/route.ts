import { NextResponse } from "next/server"

import { fetchProjectBySlug } from "@/app/(site)/(plain)/(content)/showcase/[slug]/sanity"
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
  if (!rawSlug.endsWith(".md")) return new NextResponse(null, { status: 404 })
  const slug = rawSlug.slice(0, -3)

  try {
    const project = await fetchProjectBySlug(slug, { published: true })
    if (!project) {
      return new NextResponse("# 404 Not Found\n", {
        status: 404,
        headers: MD_HEADERS
      })
    }

    const challenge = project.challenge?.trim()
    const approach = project.approach?.trim()
    const outcome = project.outcome?.trim()

    const clientLine = project.client
      ? project.client.website
        ? `**Client:** [${project.client.title}](${project.client.website})`
        : `**Client:** ${project.client.title}`
      : null

    const parts: Array<string | null> = [
      `# ${project.title}`,
      "",
      clientLine,
      project.year ? `**Year:** ${project.year}` : null,
      project.categories?.length
        ? `**Categories:** ${project.categories.map((c) => c.title).join(", ")}`
        : null,
      project.projectWebsite ? `**Website:** ${project.projectWebsite}` : null,
      project.caseStudy ? `**Case Study:** ${project.caseStudy}` : null,
      project.people?.length
        ? `**Team:** ${project.people
            .map((p) =>
              p.department ? `${p.title} (${p.department.title})` : p.title
            )
            .join(", ")}`
        : null,
      project.awards?.length
        ? `**Awards:** ${project.awards.map((a) => a.title).join(", ")}`
        : null,
      "",
      "---",
      "",
      portableTextToMarkdown(project.content, { baseUrl: SITE_URL }),
      challenge ? `\n## Challenge\n\n${challenge}` : null,
      approach ? `\n## Approach\n\n${approach}` : null,
      outcome ? `\n## Outcome\n\n${outcome}` : null,
      "",
      "---",
      "",
      `[View all content](${SITE_URL}/sitemap.md)`
    ]

    const markdown = parts.filter((part) => part !== null).join("\n")

    return new NextResponse(markdown, { headers: MD_HEADERS })
  } catch (error) {
    console.error("Error building project markdown:", error)
    return new NextResponse("# 500 Error\n\nFailed to build markdown.", {
      status: 500,
      headers: MD_HEADERS
    })
  }
}
