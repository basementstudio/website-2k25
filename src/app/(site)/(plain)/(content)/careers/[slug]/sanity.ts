import {
  sanityFetch,
  sanityFetchCached,
  sanityFetchStatic
} from "@/service/sanity"
import type { PortableTextBlock } from "@/service/sanity/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CareerPosition {
  _id: string
  _createdAt: string
  title: string
  slug: string
  type: string | null
  employmentType: string | null
  location: string | null
  isOpen: boolean
  applyUrl: string | null
  jobDescription: PortableTextBlock[] | null
  applyFormSetup: {
    formFields: string[]
    skills: Array<{ title: string; slug: string }>
  } | null
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function fetchCareerPosition(
  slug: string,
  /** Pass `published: true` for non-draft contexts (e.g. the `.md` endpoint) — disables stega so output isn't polluted with invisible chars. */
  options?: { published?: boolean }
): Promise<CareerPosition | null> {
  const query = /* groq */ `*[_type == "openPosition" && slug.current == $slug][0]{
    _id,
    _createdAt,
    title,
    "slug": slug.current,
    type,
    employmentType,
    location,
    isOpen,
    applyUrl,
    jobDescription,
    applyFormSetup {
      formFields,
      skills[] { title, slug }
    }
  }`
  if (options?.published) {
    return sanityFetchStatic<CareerPosition | null>({
      query,
      params: { slug }
    })
  }
  return sanityFetch<CareerPosition | null>({
    query,
    params: { slug }
  })
}

export interface OpenPositionIndexEntry {
  title: string
  slug: string
}

export async function fetchAllOpenPositionsForIndex(): Promise<
  OpenPositionIndexEntry[]
> {
  const query = /* groq */ `*[_type == "openPosition" && isOpen == true && defined(slug.current)] | order(title asc){
    title,
    "slug": slug.current
  }`
  return sanityFetchCached<OpenPositionIndexEntry[]>({
    query,
    perspective: "published"
  })
}

export async function fetchAllOpenPositionSlugs(): Promise<string[]> {
  const query = /* groq */ `*[_type == "openPosition" && isOpen == true]{ "slug": slug.current }.slug`
  return sanityFetchStatic<string[]>({
    query,
    perspective: "published"
  })
}

export async function fetchCareerPositionMeta(
  slug: string
): Promise<{ title: string } | null> {
  const query = /* groq */ `*[_type == "openPosition" && slug.current == $slug][0]{ title }`
  return sanityFetchCached<{ title: string } | null>({
    query,
    params: { slug },
    perspective: "published",
    boundEmptyResult: true
  })
}
