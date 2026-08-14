import { SITE_URL } from "@/lib/constants"
import type { PortableTextBlock, SanityImage } from "@/service/sanity/types"

import { extractPlainText } from "../extract-text"
import { type Award, formatAwards } from "../format-award"
import { createImageObject } from "../image-object"
import { ORGANIZATION_ID } from "./organization"

interface ProjectData {
  title: string
  slug: string
  year?: string | number | null
  categories?: { title: string | null }[] | null
  client?: { title: string | null; website?: string | null } | null
  cover?: SanityImage | null
  content?: PortableTextBlock[] | null
  projectWebsite?: string | null
  awards?: Award[] | null
}

export const generateCreativeWorkSchema = (project: ProjectData) => {
  if (!project.slug) return null

  const description = project.content
    ? extractPlainText(project.content)
    : undefined
  const image = createImageObject(project.cover)
  const keywords = project.categories
    ?.map((c) => c.title)
    .filter((value): value is string => Boolean(value))
  const award = formatAwards(project.awards)
  const url = `${SITE_URL}/showcase/${project.slug}`

  return {
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    name: project.title,
    url,
    ...(project.year ? { dateCreated: String(project.year) } : {}),
    ...(description ? { description } : {}),
    ...(keywords?.length ? { keywords } : {}),
    ...(image ? { image } : {}),
    ...(award.length > 0 ? { award } : {}),
    ...(project.projectWebsite ? { sameAs: project.projectWebsite } : {}),
    creator: { "@id": ORGANIZATION_ID },
    inLanguage: "en"
  }
}
