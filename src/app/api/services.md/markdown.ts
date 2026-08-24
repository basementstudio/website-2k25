import { cacheLife } from "next/cache"

import {
  fetchAwardsForMarkdown,
  fetchServicesPage,
  fetchTestimonial
} from "@/app/(site)/(canvas)/(content)/services/sanity"
import { SITE_URL } from "@/lib/constants"
import {
  escapeLinkLabel,
  type MarkdownResult,
  NOT_FOUND_MARKDOWN
} from "@/service/markdown/document"
import { portableTextToMarkdown } from "@/service/sanity/portable-text-to-markdown"

export async function buildServicesMarkdown(): Promise<MarkdownResult> {
  "use cache"
  const [services, awards, testimonial] = await Promise.all([
    fetchServicesPage({ published: true }),
    fetchAwardsForMarkdown(),
    fetchTestimonial({ published: true })
  ])
  if (!services) {
    cacheLife("hours")
    return { markdown: NOT_FOUND_MARKDOWN, status: 404 }
  }

  const serviceCategories = services.serviceCategories?.length
    ? services.serviceCategories
        .map((cat) =>
          [
            `### ${cat.title}`,
            "",
            portableTextToMarkdown(cat.description, { baseUrl: SITE_URL })
          ]
            .filter(Boolean)
            .join("\n")
        )
        .join("\n\n")
    : null

  // HTML (ventures.tsx) only shows the first venture — match that.
  const venture = services.ventures?.[0]
  const ventures = venture
    ? [
        `### ${venture.title}`,
        "",
        portableTextToMarkdown(venture.content, { baseUrl: SITE_URL })
      ]
        .filter(Boolean)
        .join("\n")
    : null

  const awardsList = awards.length
    ? awards
        .map((award) => {
          const label = award.awardUrl
            ? `[${escapeLinkLabel(award.title)}](${award.awardUrl})`
            : award.title
          const year = award.date ? new Date(award.date).getFullYear() : null
          const detail = [award.projectName, year].filter(Boolean).join(", ")
          return detail ? `- ${label} — ${detail}` : `- ${label}`
        })
        .join("\n")
    : null

  // `role` is Portable Text or a plain string depending on document age.
  const testimonialRole = testimonial
    ? (Array.isArray(testimonial.role)
        ? portableTextToMarkdown(testimonial.role, { baseUrl: SITE_URL })
        : (testimonial.role ?? "")
      )
        .replace(/\s+/g, " ")
        .trim()
    : ""
  const testimonialBlock = testimonial?.content
    ? [
        `> ${testimonial.content.replace(/\n/g, "\n> ")}`,
        ">",
        `> — ${[
          testimonial.name,
          testimonial.handle
            ? `(${testimonial.handle.startsWith("@") ? testimonial.handle : `@${testimonial.handle}`})`
            : null,
          testimonialRole ? `— ${testimonialRole}` : null
        ]
          .filter(Boolean)
          .join(" ")}`
      ].join("\n")
    : null

  const parts: Array<string | null> = [
    "# Services",
    "",
    portableTextToMarkdown(services.intro, { baseUrl: SITE_URL }) || null,
    "",
    "---",
    "",
    serviceCategories ? "## What We Offer" : null,
    serviceCategories ? "" : null,
    serviceCategories,
    serviceCategories ? "" : null,
    ventures ? "## Ventures" : null,
    ventures ? "" : null,
    ventures,
    ventures ? "" : null,
    awardsList ? "## Awards" : null,
    awardsList ? "" : null,
    awardsList,
    awardsList ? "" : null,
    testimonialBlock ? "## Testimonial" : null,
    testimonialBlock ? "" : null,
    testimonialBlock,
    "",
    "---",
    "",
    `[View all content](${SITE_URL}/sitemap.md)`
  ]

  const markdown = parts.filter((part) => part !== null).join("\n")
  return { markdown, status: 200 }
}
