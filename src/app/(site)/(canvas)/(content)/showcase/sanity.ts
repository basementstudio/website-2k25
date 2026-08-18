import { sanityFetch, sanityFetchCached } from "@/service/sanity"
import {
  imageFragment,
  muxVideoFragment,
  videoFragment
} from "@/service/sanity/queries"
import type {
  SanityImage,
  SanityMuxVideo,
  SanityVideo
} from "@/service/sanity/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShowcaseProject {
  _id: string
  title: string
  slug: string
  client: { _id: string; title: string } | null
  year: number | null
  categories: Array<{ _id: string; title: string }> | null
  cover: SanityImage | null
  coverVideo: SanityVideo | null
  muxCoverVideo: SanityMuxVideo | null
  icon: SanityImage | null
  showcase: Array<{
    _key: string
    image: SanityImage | null
    video: SanityVideo | null
    muxVideo: SanityMuxVideo | null
  }> | null
}

export interface ShowcaseCategory {
  _id: string
  title: string
  slug: string
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const showcaseProjectsQuery = /* groq */ `
  *[_type == "showcasePage"][0]{
    "projects": projects[]->{
      _id,
      title,
      "slug": slug.current,
      client->{ _id, title },
      year,
      categories[]->{ _id, title },
      cover ${imageFragment},
      coverVideo ${videoFragment},
      muxCoverVideo ${muxVideoFragment},
      icon ${imageFragment},
      showcase[0...6]{
        _key,
        image ${imageFragment},
        video ${videoFragment},
        muxVideo ${muxVideoFragment}
      }
    }
  }.projects
`

const showcaseCountQuery = /* groq */ `
  count(*[_type == "showcasePage"][0].projects)
`

const categoriesQuery = /* groq */ `
  *[_type == "projectCategory"] | order(title asc){
    _id,
    title,
    "slug": slug.current
  }
`

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function fetchProjects(): Promise<ShowcaseProject[]> {
  "use cache"
  const projects = await sanityFetch<ShowcaseProject[] | null>({
    query: showcaseProjectsQuery
  })
  return projects ?? []
}

export async function fetchProjectsCount(): Promise<number> {
  "use cache"
  return sanityFetch<number>({
    query: showcaseCountQuery
  })
}

const projectListForSchemaQuery = /* groq */ `
  *[_type == "showcasePage"][0].projects[]->{
    title,
    "slug": slug.current
  }
`

/** Lightweight title + slug list of showcase projects, for the CollectionPage schema. */
export async function fetchProjectListForSchema(): Promise<
  Array<{ title: string; slug: string }>
> {
  "use cache"
  const projects = await sanityFetch<Array<{
    title: string
    slug: string
  }> | null>({
    query: projectListForSchemaQuery
  })
  return projects ?? []
}

export async function fetchCategories(): Promise<ShowcaseCategory[]> {
  "use cache"
  return sanityFetch<ShowcaseCategory[]>({
    query: categoriesQuery
  })
}

export interface ShowcaseListEntry {
  title: string
  slug: string
  client: string | null
  year: number | null
  categories: string[] | null
  description: string | null
}

const showcaseListForMarkdownQuery = /* groq */ `
  *[_type == "showcasePage"][0].projects[]->{
    title,
    "slug": slug.current,
    "client": client->title,
    year,
    "categories": categories[]->title,
    "description": pt::text(content[0])
  }
`

/** Curated showcase project list (title, slug, client, year, categories, first-paragraph description) for the `/showcase.md` markdown page. */
export async function fetchShowcaseListForMarkdown(): Promise<
  ShowcaseListEntry[]
> {
  const projects = await sanityFetchCached<ShowcaseListEntry[] | null>({
    query: showcaseListForMarkdownQuery,
    perspective: "published"
  })
  return projects ?? []
}
