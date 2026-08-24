import { cacheLife } from "next/cache"

import { fetchHomepage } from "@/app/(site)/(canvas)/(content)/(home)/sanity"
import { COMPANY_FACTS, formatFactList } from "@/lib/company-facts"
import { SITE_URL } from "@/lib/constants"
import {
  type MarkdownResult,
  NOT_FOUND_MARKDOWN
} from "@/service/markdown/document"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"

export async function buildIndexMarkdown(): Promise<MarkdownResult> {
  "use cache"
  const { homepage } = await fetchHomepage({ published: true })
  if (!homepage) {
    cacheLife("hours")
    return { markdown: NOT_FOUND_MARKDOWN, status: 404 }
  }

  const featuredWork = homepage.featuredProjects?.length
    ? homepage.featuredProjects
        .map((item) => {
          const label = item.title || item.project?.title || "Untitled"
          const slug = item.project?.slug?.current
          const link = slug
            ? `[${label}](${SITE_URL}/showcase/${slug}.md)`
            : label
          return item.excerpt ? `- ${link} — ${item.excerpt}` : `- ${link}`
        })
        .join("\n")
    : null

  const capabilities = homepage.capabilities?.length
    ? homepage.capabilities
        .map((cap) => {
          // Match HTML's title-based filter param (slug isn't used for filtering).
          const lines = [
            `### [${cap.title}](${SITE_URL}/showcase?category=${encodeURIComponent(cap.title)})`
          ]
          if (cap.description) lines.push("", cap.description)
          if (cap.subcategories?.length) {
            lines.push("", ...cap.subcategories.map((s) => `- ${s.title}`))
          }
          return lines.join("\n")
        })
        .join("\n\n")
    : null

  const clients = homepage.clients?.length
    ? homepage.clients
        .map((c) => (c.website ? `[${c.title}](${c.website})` : c.title))
        .join(", ")
    : null

  const whatWeDoIntro =
    portableTextToMarkdown(homepage.capabilitiesIntro, {
      baseUrl: SITE_URL
    }) || null
  const hasWhatWeDo = Boolean(whatWeDoIntro || capabilities)
  const hasBody = Boolean(featuredWork || hasWhatWeDo || clients)

  const parts: Array<string | null> = [
    "# basement.studio",
    "",
    portableTextToMarkdown(homepage.introTitle, { baseUrl: SITE_URL }) || null,
    "",
    portableTextToMarkdown(homepage.introSubtitle, { baseUrl: SITE_URL }) ||
      null,
    "",
    hasBody ? "---" : null,
    hasBody ? "" : null,
    featuredWork ? "## Selected Work" : null,
    featuredWork ? "" : null,
    featuredWork,
    featuredWork ? "" : null,
    hasWhatWeDo ? "## What We Do" : null,
    hasWhatWeDo ? "" : null,
    whatWeDoIntro,
    capabilities ? "" : null,
    capabilities,
    capabilities ? "" : null,
    clients ? "## Clients" : null,
    clients ? "" : null,
    clients,
    "",
    // Entity block mirroring the homepage's crawlable about section.
    "## About basement.studio",
    "",
    COMPANY_FACTS.description,
    "",
    `Founded in ${COMPANY_FACTS.foundingDate} and based in ${COMPANY_FACTS.locationName}, the studio works primarily with technology companies in the San Francisco Bay Area and has partnered with startups and enterprise brands including ${formatFactList(COMPANY_FACTS.notableClients)}.`,
    "",
    `Services: ${formatFactList(COMPANY_FACTS.services)}.`,
    "",
    COMPANY_FACTS.awardsSummary,
    "",
    COMPANY_FACTS.geistAttribution,
    "",
    "## Contact",
    "",
    `- General & project inquiries: ${COMPANY_FACTS.contactEmail}`,
    `- New business / sales: ${COMPANY_FACTS.salesEmail}`,
    `- [Contact page](${SITE_URL}/contact.md)`,
    "",
    "## More",
    "",
    `- [Services](${SITE_URL}/services.md)`,
    `- [Showcase](${SITE_URL}/showcase.md)`,
    `- [Blog](${SITE_URL}/blog.md)`,
    `- [People](${SITE_URL}/people.md)`,
    `- [Lab](${SITE_URL}/lab.md)`,
    `- [FAQ](${SITE_URL}/faq.md)`,
    "",
    "---",
    "",
    `[View all content](${SITE_URL}/sitemap.md)`
  ]

  const markdown = parts.filter((part) => part !== null).join("\n")
  return { markdown, status: 200 }
}
