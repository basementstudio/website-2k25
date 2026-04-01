import { extractPlainText } from "../extract-text"
import { createImageObject } from "../image-object"

const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"

interface Award {
  title: string
  date?: string | number | null
  projectName?: string | null
}

interface ProjectData {
  _title: string
  project?: {
    _slug?: string | null
    year?: string | number | null
    categories?: { _title: string | null }[] | null
    client?: { _title: string | null; website?: string | null } | null
    cover?: {
      url: string
      schemaUrl?: string | null
      width: number | null
      height: number | null
    } | null
    content?: { json: { content: unknown } } | null
    projectWebsite?: string | null
    awards?: Award[] | null
  } | null
}

const formatAward = (award: Award) => {
  const year =
    award.date !== null && award.date !== undefined
      ? new Date(award.date).getUTCFullYear()
      : null

  const title = award.title.trim()
  const projectName = award.projectName?.trim()
  const projectAlreadyIncludesYear =
    projectName && year ? projectName.endsWith(String(year)) : false

  if (projectName && year && projectAlreadyIncludesYear) {
    return `${title} - ${projectName}`
  }
  if (projectName && year) return `${title} - ${projectName} ${year}`
  if (projectName) return `${title} - ${projectName}`
  if (year) return `${title} ${year}`

  return title
}

export const generateCreativeWorkSchema = (entry: ProjectData) => {
  const project = entry.project
  if (!project || !project._slug) return null

  const description = project.content?.json?.content
    ? extractPlainText(project.content.json.content)
    : undefined
  const image = createImageObject(project.cover)
  const keywords = project.categories
    ?.map((c) => c._title)
    .filter((value): value is string => Boolean(value))
  const award = [...new Set((project.awards ?? []).map(formatAward).filter(Boolean))]
  const url = `${SITE_URL}/showcase/${project._slug}`

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    name: entry._title,
    url,
    ...(project.year ? { dateCreated: String(project.year) } : {}),
    ...(description ? { description } : {}),
    ...(keywords?.length ? { keywords } : {}),
    ...(image ? { image } : {}),
    ...(award.length > 0 ? { award } : {}),
    ...(project.projectWebsite ? { sameAs: project.projectWebsite } : {}),
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL
    },
    inLanguage: "en"
  }
}
