import {
  sanityFetch,
  sanityFetchCached,
  sanityFetchStatic
} from "@/service/sanity"
import {
  imageFragment,
  muxVideoFragment,
  videoFragment
} from "@/service/sanity/queries"
import type {
  PortableTextBlock,
  SanityImage,
  SanityMuxVideo,
  SanityVideo
} from "@/service/sanity/types"

import { selectRelatedProjects } from "./related-projects.logic"

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
  challenge: string | null
  approach: string | null
  outcome: string | null
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
    muxVideo: SanityMuxVideo | null
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
    challenge,
    approach,
    outcome,
    caseStudy,
    people[]->{ _id, title, department->{ title } },
    cover ${imageFragment},
    icon ${imageFragment},
    showcase[]{
      _key,
      image ${imageFragment},
      video ${videoFragment},
      muxVideo ${muxVideoFragment}
    },
    "awards": *[_type == "award" && project._ref == ^._id]{ title, date }
  }
`

const allProjectSlugsQuery = /* groq */ `
  *[_type == "showcasePage"][0].projects[]->{ "slug": slug.current }
`

const projectMetaQuery = /* groq */ `
  *[_type == "project" && slug.current == $slug][0]{ title, content, challenge, outcome }
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
  slug: string,
  /** Pass `published: true` for non-draft contexts (e.g. the `.md` endpoint) — disables stega so output isn't polluted with invisible chars. */
  options?: { published?: boolean }
): Promise<ShowcaseProjectDetail | null> {
  if (options?.published) {
    return sanityFetchStatic<ShowcaseProjectDetail | null>({
      query: projectBySlugQuery,
      params: { slug }
    })
  }
  return sanityFetch<ShowcaseProjectDetail | null>({
    query: projectBySlugQuery,
    params: { slug }
  })
}

export interface ProjectIndexEntry {
  title: string
  slug: string
  year: number | null
}

export async function fetchAllProjectsForIndex(): Promise<ProjectIndexEntry[]> {
  const query = /* groq */ `*[_type == "project" && defined(slug.current)] | order(year desc, title asc){
    title,
    "slug": slug.current,
    year
  }`
  return sanityFetchCached<ProjectIndexEntry[]>({
    query,
    perspective: "published"
  })
}

export async function fetchAllProjectSlugs(): Promise<Array<{
  slug: string
}> | null> {
  return sanityFetchStatic<Array<{ slug: string }> | null>({
    query: allProjectSlugsQuery,
    perspective: "published"
  })
}

export async function fetchProjectMeta(slug: string): Promise<{
  title: string
  content: PortableTextBlock[] | null
  challenge: string | null
  outcome: string | null
} | null> {
  return sanityFetchCached<{
    title: string
    content: PortableTextBlock[] | null
    challenge: string | null
    outcome: string | null
  } | null>({
    query: projectMetaQuery,
    params: { slug },
    perspective: "published"
  })
}

export async function fetchRelatedProjects(
  excludeSlug: string
): Promise<RelatedProject[]> {
  const all = await sanityFetchCached<RelatedProject[] | null>({
    query: relatedProjectsQuery
  })
  if (!all) return []

  return selectRelatedProjects({
    projects: all,
    excludeSlug
  })
}
