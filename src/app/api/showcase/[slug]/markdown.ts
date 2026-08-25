import { cacheLife } from "next/cache"
import { stegaClean } from "next-sanity"

import {
  fetchRelatedProjects,
  getProjectData
} from "@/app/(site)/(plain)/(content)/showcase/[slug]/sanity"
import { SITE_URL } from "@/lib/constants"
import {
  type MarkdownResult,
  NOT_FOUND_MARKDOWN
} from "@/service/markdown/document"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"

export async function buildShowcaseMarkdown(
  slug: string
): Promise<MarkdownResult> {
  "use cache"
  const projectData = await getProjectData(slug)
  if (!projectData) {
    cacheLife("hours")
    return { markdown: NOT_FOUND_MARKDOWN, status: 404 }
  }
  // getProjectData is draft-aware (no published pin) — clean any stega chars a
  // draft-mode editor's cookie would inject into this crawler-facing output.
  const project = stegaClean(projectData)
  const relatedProjects = stegaClean(await fetchRelatedProjects(slug))

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
    "",
    relatedProjects.length ? "## Related Projects" : null,
    relatedProjects.length ? "" : null,
    relatedProjects.length
      ? relatedProjects
          .map(
            (related) =>
              `- [${related.title}](${SITE_URL}/showcase/${related.slug}.md)`
          )
          .join("\n")
      : null,
    relatedProjects.length ? "" : null,
    "---",
    "",
    `[View all content](${SITE_URL}/sitemap.md)`
  ]

  const markdown = parts.filter((part) => part !== null).join("\n")
  return { markdown, status: 200 }
}
