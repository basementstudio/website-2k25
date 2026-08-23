import { fetchShowcaseListForMarkdown } from "@/app/(site)/(canvas)/(content)/showcase/sanity"
import { SITE_URL } from "@/lib/constants"
import {
  escapeLinkLabel,
  type MarkdownResult
} from "@/service/markdown/document"
import { truncateDescription } from "@/utils/seo"

export async function buildShowcaseListMarkdown(): Promise<
  MarkdownResult<200>
> {
  "use cache"
  const projects = await fetchShowcaseListForMarkdown()

  const list = projects
    .map((project) => {
      const clientYear = [project.client, project.year]
        .filter(Boolean)
        .join(", ")
      const categories = project.categories?.length
        ? `(${project.categories.join(", ")})`
        : null
      const meta = [clientYear || null, categories].filter(Boolean).join(" ")
      const detail = [
        meta || null,
        truncateDescription(project.description) || null
      ]
        .filter(Boolean)
        .join(" — ")
      const link = `[${escapeLinkLabel(project.title)}](${SITE_URL}/showcase/${project.slug}.md)`
      return detail ? `- ${link} — ${detail}` : `- ${link}`
    })
    .join("\n")

  const parts: Array<string | null> = [
    "# Showcase",
    "",
    "Selected projects by basement.studio.",
    list ? "" : null,
    list || null,
    "",
    "---",
    "",
    `[View all content](${SITE_URL}/sitemap.md)`
  ]

  const markdown = parts.filter((part) => part !== null).join("\n")
  return { markdown, status: 200 }
}
