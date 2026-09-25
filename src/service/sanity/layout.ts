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
 * Backs the navbar, footer, showcase hero count and Organization JSON-LD.
 * `stega: false` even in draft mode: this feeds JSON-LD, which stega chars
 * corrupt — at the cost of click-to-edit on the footer newsletter.
 */
export async function fetchLayoutData(): Promise<LayoutData> {
  "use cache"
  return sanityFetch<LayoutData>({
    query: layoutDataQuery,
    stega: false,
    tag: "layout.data"
  })
}
