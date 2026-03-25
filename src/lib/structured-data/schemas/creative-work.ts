import { extractPlainText } from "../extract-text"

const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"

interface ProjectData {
  _title: string
  project?: {
    _slug?: string | null
    year?: string | null
    categories?: { _title: string } | null
    client?: { _title: string; website?: string | null } | null
    cover?: { url: string; width: number; height: number } | null
    content?: { json: { content: unknown } } | null
    projectWebsite?: string | null
  } | null
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
    ...(project.year ? { dateCreated: project.year } : {}),
    ...(description ? { description } : {}),
    ...(project.categories?._title
      ? { genre: project.categories._title }
      : {}),
    ...(project.cover?.url
      ? {
          image: {
            "@type": "ImageObject",
            url: project.cover.url,
            width: project.cover.width,
            height: project.cover.height
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
      : {})
  }
}
