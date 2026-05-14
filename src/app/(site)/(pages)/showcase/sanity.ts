import { sanityFetch } from "@/service/sanity"
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
  const projects = await sanityFetch<ShowcaseProject[] | null>({
    query: showcaseProjectsQuery
  })
  return projects ?? []
}

export async function fetchProjectsCount(): Promise<number> {
  return sanityFetch<number>({
    query: showcaseCountQuery
  })
}

export async function fetchCategories(): Promise<ShowcaseCategory[]> {
  return sanityFetch<ShowcaseCategory[]>({
    query: categoriesQuery
  })
}
