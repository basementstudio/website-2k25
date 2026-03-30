import { extractPlainText } from "../extract-text"

const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"

interface ProjectData {
  _title: string
  project?: {
    _slug?: string | null
    year?: string | number | null
    categories?: { _title: string | null }[] | null
    client?: { _title: string | null; website?: string | null } | null
    cover?: { url: string; width: number | null; height: number | null } | null
    content?: { json: { content: unknown } } | null
    projectWebsite?: string | null
  } | null
  awards?: { title: string }[]
}

export const generateCreativeWorkSchema = (entry: ProjectData) => {
  const project = entry.project
  if (!project) return null

  const description = project.content?.json?.content
    ? extractPlainText(project.content.json.content, 200)
    : undefined

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: entry._title,
    url: `${SITE_URL}/showcase/${project._slug}`,
    ...(project.year ? { dateCreated: String(project.year) } : {}),
    ...(description ? { description } : {}),
    ...(project.categories && project.categories.length > 0
      ? {
          genre: project.categories
            .map((c) => c._title)
            .filter(Boolean)
            .join(", ")
        }
      : {}),
    ...(project.cover?.url
      ? {
          image: {
            "@type": "ImageObject",
            url: project.cover.url,
            ...(project.cover.width ? { width: project.cover.width } : {}),
            ...(project.cover.height
              ? { height: project.cover.height }
              : {})
          }
        }
      : {}),
    ...(project.projectWebsite ? { sameAs: project.projectWebsite } : {}),
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL
    },
    ...(project.client?._title
      ? {
          accountablePerson: {
            "@type": "Organization",
            name: project.client._title,
            ...(project.client.website
              ? { url: project.client.website }
              : {})
          }
        }
      : {}),
    ...(entry.awards && entry.awards.length > 0
      ? { award: entry.awards.map((a) => a.title) }
      : {})
  }
}
