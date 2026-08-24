import { cacheLife } from "next/cache"

import {
  fetchOpenPositions,
  fetchPeopleForMarkdown,
  fetchPeoplePage,
  fetchValuesForMarkdown
} from "@/app/(site)/(canvas)/(content)/people/sanity"
import { SITE_URL } from "@/lib/constants"
import {
  escapeLinkLabel,
  escapeLinkUrl,
  type MarkdownResult,
  NOT_FOUND_MARKDOWN
} from "@/service/markdown/document"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"
import { displayPlatform } from "@/utils/social-platform"

// Same department whitelist and order the HTML crew page renders (see crew.tsx)
const CREW_DEPARTMENTS = ["Management", "Design", "Development"]

export async function buildPeopleMarkdown(): Promise<MarkdownResult> {
  "use cache"
  const [page, people, positions, values] = await Promise.all([
    fetchPeoplePage({ published: true }),
    fetchPeopleForMarkdown({ published: true }),
    fetchOpenPositions({ published: true }),
    fetchValuesForMarkdown({ published: true })
  ])

  if (!page) {
    cacheLife("hours")
    return { markdown: NOT_FOUND_MARKDOWN, status: 404 }
  }

  const crew = people.filter(
    (person) =>
      person.department?.title &&
      CREW_DEPARTMENTS.includes(person.department.title)
  )

  // Grouped under department sub-headings to mirror crew.tsx.
  const teamSections = CREW_DEPARTMENTS.map((dept) => {
    const deptPeople = crew.filter(
      (person) => person.department?.title === dept
    )
    if (!deptPeople.length) return null

    const lines = deptPeople
      .map((person) => {
        const socials = person.socialNetworks?.length
          ? person.socialNetworks
              .map(
                (s) =>
                  ` — [${escapeLinkLabel(displayPlatform(s.platform))}](${escapeLinkUrl(s.url)})`
              )
              .join("")
          : ""
        const base = person.role
          ? `- **${person.title}** — ${person.role}`
          : `- **${person.title}**`
        return `${base}${socials}`
      })
      .join("\n")

    return [`### ${dept}`, "", lines].join("\n")
  }).filter((section): section is string => section !== null)

  const team = teamSections.length ? teamSections.join("\n\n") : null

  // Mirrors the HTML order: crew → values → open positions (see page.tsx).
  const valuesList = values.length
    ? values
        .map((value) =>
          [
            `### ${value.title}`,
            "",
            portableTextToMarkdown(value.description, { baseUrl: SITE_URL })
          ]
            .filter(Boolean)
            .join("\n")
        )
        .join("\n\n")
    : null

  // Closed roles are dropped — /careers/[slug].md 404s on them, so
  // linking one would be a dead link.
  const openPositions = positions.filter((p) => p.isOpen)
  const openPositionsList = openPositions.length
    ? openPositions
        .map((p) => {
          const detail = [p.type, p.location].filter(Boolean).join(", ")
          const link = `[${escapeLinkLabel(p.title)}](${SITE_URL}/careers/${p.slug}.md)`
          return detail ? `- ${link} — ${detail}` : `- ${link}`
        })
        .join("\n")
    : "none currently open"

  const parts: Array<string | null> = [
    `# ${page.title || "People"}`,
    "",
    portableTextToMarkdown(page.subheading1, { baseUrl: SITE_URL }) || null,
    "",
    portableTextToMarkdown(page.subheading2, { baseUrl: SITE_URL }) || null,
    "",
    "---",
    "",
    team ? "## Team" : null,
    team ? "" : null,
    team,
    team ? "" : null,
    valuesList ? "## Values" : null,
    valuesList ? "" : null,
    valuesList,
    valuesList ? "" : null,
    portableTextToMarkdown(page.preOpenPositionsText, {
      baseUrl: SITE_URL
    }) || null,
    "",
    "## Open Positions",
    "",
    openPositionsList,
    "",
    "---",
    "",
    `[View all content](${SITE_URL}/sitemap.md)`
  ]

  const markdown = parts.filter((part) => part !== null).join("\n")
  return { markdown, status: 200 }
}
