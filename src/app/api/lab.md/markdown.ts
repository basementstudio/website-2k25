import { fetchLabProjectsPublished } from "@/actions/laboratory-fetch/sanity"
import { SITE_URL } from "@/lib/constants"

// CMS strings land inside `[label](url)` syntax — escape the delimiters so a
// bracketed label or a parenthesized URL can't break the link.
const escapeLinkLabel = (text: string) => text.replace(/[\\[\]]/g, "\\$&")
const escapeLinkUrl = (url: string) =>
  url.replace(/\(/g, "%28").replace(/\)/g, "%29")

export async function buildLabMarkdown(): Promise<{
  markdown: string
  status: 200
}> {
  "use cache"
  const projects = await fetchLabProjectsPublished()

  // `url` is the experiment's source path (e.g. "30.wireframe-reveal.js");
  // the live demo lives under lab.basement.studio (see arcade-labs-list.tsx).
  const list = projects
    .map((project) => {
      const link = `[${escapeLinkLabel(project.title)}](https://lab.basement.studio/experiments/${escapeLinkUrl(project.url)})`
      return project.description
        ? `- ${link} — ${project.description}`
        : `- ${link}`
    })
    .join("\n")

  const parts: Array<string | null> = [
    "# Lab",
    "",
    "Experiments and interactive demos built by basement.studio.",
    "",
    `The arcade at [basement.studio/lab](${SITE_URL}/lab) is a desktop WebGL experience; a lightweight mirror lives at [lab.basement.studio](https://lab.basement.studio/).`,
    "",
    "---",
    "",
    list ? "## Experiments" : null,
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
