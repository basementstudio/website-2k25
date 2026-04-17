import { sanityFetch } from "@/service/sanity"
import { imageFragment, videoFragment } from "@/service/sanity/queries"
import type {
  PortableTextBlock,
  SanityImage,
  SanityVideo
} from "@/service/sanity/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShowcaseProjectDetail {
  _id: string
  title: string
  slug: string
  client: { title: string; website: string | null } | null
  year: number | null
  categories: Array<{ title: string }> | null
  projectWebsite: string | null
  content: PortableTextBlock[] | null
  caseStudy: string | null
  people: Array<{
    _id: string
    title: string
    department: { title: string } | null
  }> | null
  cover: SanityImage | null
  icon: SanityImage | null
  showcase: Array<{
    _key: string
    image: SanityImage | null
    video: SanityVideo | null
  }> | null
  awards: Array<{ title: string; date: string | null }> | null
}

export interface RelatedProject {
  _id: string
  title: string
  slug: string
  icon: SanityImage | null
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const projectBySlugQuery = /* groq */ `
  *[_type == "project" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    client->{ title, website },
    year,
    categories[]->{ title },
    projectWebsite,
    content,
    caseStudy,
    people[]->{ _id, title, department->{ title } },
    cover ${imageFragment},
    icon ${imageFragment},
    showcase[]{
      _key,
      image ${imageFragment},
      video ${videoFragment}
    },
    "awards": *[_type == "award" && project._ref == ^._id]{ title, date }
  }
`

const allProjectSlugsQuery = /* groq */ `
  *[_type == "showcasePage"][0].projects[]->{ "slug": slug.current }
`

const projectMetaQuery = /* groq */ `
  *[_type == "project" && slug.current == $slug][0]{ title }
`

const relatedProjectsQuery = /* groq */ `
  *[_type == "showcasePage"][0]{
    "projects": projects[]->{
      _id,
      title,
      "slug": slug.current,
      icon ${imageFragment}
    }
  }.projects
`

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function fetchProjectBySlug(
  slug: string
): Promise<ShowcaseProjectDetail | null> {
  return sanityFetch<ShowcaseProjectDetail | null>({
    query: projectBySlugQuery,
    params: { slug }
  })
}

export async function fetchAllProjectSlugs(): Promise<Array<{
  slug: string
}> | null> {
  return sanityFetch<Array<{ slug: string }> | null>({
    query: allProjectSlugsQuery,
    stega: false,
    perspective: "published"
  })
}

export async function fetchProjectMeta(
  slug: string
): Promise<{ title: string } | null> {
  return sanityFetch<{ title: string } | null>({
    query: projectMetaQuery,
    params: { slug },
    stega: false,
    perspective: "published"
  })
}

export async function fetchRelatedProjects(
  excludeSlug: string
): Promise<RelatedProject[]> {
  const all = await sanityFetch<RelatedProject[] | null>({
    query: relatedProjectsQuery
  })
  if (!all) return []

  const filtered = all.filter((p) => p.slug !== excludeSlug)

  // Pick 2 random projects
  const shuffled = filtered.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 2)
}
