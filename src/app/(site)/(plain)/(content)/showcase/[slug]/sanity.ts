import { cacheLife } from "next/cache"

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
  *[_type == "project" && slug.current == $slug][0]{ title, content }
`

// Slugs only — icon+lqip is fetched separately for just the 2 selected.
const relatedProjectsSlugsQuery = /* groq */ `
  *[_type == "showcasePage"][0]{
    "projects": projects[]->{
      _id,
      title,
      "slug": slug.current
    }
  }.projects
`

const relatedProjectsIconsQuery = /* groq */ `
  *[_type == "project" && slug.current in $slugs]{
    "slug": slug.current,
    icon ${imageFragment}
  }
`

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function fetchProjectBySlug(
  slug: string
): Promise<ShowcaseProjectDetail | null> {
  return sanityFetch<ShowcaseProjectDetail | null>({
    query: projectBySlugQuery,
    params: { slug },
    tag: "showcase.project-by-slug"
  })
}

/** Shared per-slug cache entry for the human project page and the `.md` builder. */
export async function getProjectData(
  slug: string
): Promise<ShowcaseProjectDetail | null> {
  "use cache"
  const project = await fetchProjectBySlug(slug)
  if (!project) cacheLife("hours")
  return project
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
    perspective: "published",
    tag: "showcase.projects-index"
  })
}

export async function fetchAllProjectSlugs(): Promise<Array<{
  slug: string
}> | null> {
  return sanityFetchStatic<Array<{ slug: string }> | null>({
    query: allProjectSlugsQuery,
    perspective: "published",
    tag: "showcase.project-slugs.static-params"
  })
}

export async function fetchProjectMeta(
  slug: string
): Promise<{ title: string; content: PortableTextBlock[] | null } | null> {
  return sanityFetchCached<{
    title: string
    content: PortableTextBlock[] | null
  } | null>({
    query: projectMetaQuery,
    params: { slug },
    perspective: "published",
    boundEmptyResult: true,
    tag: "showcase.project-meta"
  })
}

export async function fetchRelatedProjects(
  excludeSlug: string
): Promise<RelatedProject[]> {
  const all = await sanityFetchCached<Array<{
    _id: string
    title: string
    slug: string
  }> | null>({
    query: relatedProjectsSlugsQuery,
    tag: "showcase.related-projects"
  })
  if (!all) return []

  const selected = selectRelatedProjects({
    projects: all.map((project) => ({ ...project, icon: null })),
    excludeSlug
  })
  if (!selected.length) return []

  const icons = await sanityFetchCached<
    Array<{ slug: string; icon: SanityImage | null }>
  >({
    query: relatedProjectsIconsQuery,
    params: { slugs: selected.map((project) => project.slug) },
    tag: "showcase.related-project-icons"
  })
  const iconBySlug = new Map(icons.map((i) => [i.slug, i.icon]))

  return selected.map((project) => ({
    ...project,
    icon: iconBySlug.get(project.slug) ?? null
  }))
}
