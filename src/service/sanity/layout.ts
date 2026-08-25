import { sanityFetch } from "@/service/sanity"
import type { PortableTextBlock } from "@/service/sanity/types"

export interface LayoutCompanyInfo {
  github: string | null
  instagram: string | null
  twitter: string | null
  linkedIn: string | null
  newsletter: PortableTextBlock[] | null
}

export interface LayoutAward {
  title: string
  date: string | null
  projectName: string | null
}

export interface LayoutData {
  /** `null` when the `companyInfo` singleton is missing or unpublished. */
  companyInfo: LayoutCompanyInfo | null
  projectsCount: number
  postsCount: number
  awards: LayoutAward[] | null
}

const layoutDataQuery = /* groq */ `{
  "companyInfo": *[_type == "companyInfo"][0]{
    github,
    instagram,
    twitter,
    linkedIn,
    newsletter
  },
  "projectsCount": count(*[_type == "showcasePage"][0].projects),
  "postsCount": count(*[_type == "post"]),
  "awards": *[_type == "award" && defined(title)] | order(date desc){
    title,
    date,
    "projectName": project->title
  }
}`

/**
 * Single Live query backing the navbar, footer, showcase hero count, and the
 * Organization JSON-LD — collapses what used to be 5 separate cache entries
 * hit on every route into 1.
 *
 * `stega: false` regardless of draft mode: this data is JSON.stringify'd into
 * JSON-LD (see `page-json-ld.tsx`), which stega chars would corrupt. Cost:
 * the footer newsletter loses click-to-edit overlays in draft mode.
 */
export async function fetchLayoutData(): Promise<LayoutData> {
  "use cache"
  return sanityFetch<LayoutData>({
    query: layoutDataQuery,
    stega: false,
    tag: "layout.data"
  })
}
