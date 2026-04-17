import { sanityFetch } from "@/service/sanity"
import type { PortableTextBlock } from "@/service/sanity/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CareerPosition {
  _id: string
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

export async function fetchCareersHeroTitle(): Promise<string> {
  const query = /* groq */ `*[_type == "careersPostPage"][0].heroTitle`
  const result = await sanityFetch<string | null>({
    query
  })
  return result ?? "Join our Creative Team!"
}

export async function fetchCareerPosition(
  slug: string
): Promise<CareerPosition | null> {
  const query = /* groq */ `*[_type == "openPosition" && slug.current == $slug][0]{
    _id,
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
  return sanityFetch<CareerPosition | null>({
    query,
    params: { slug }
  })
}

export async function fetchAllOpenPositionSlugs(): Promise<string[]> {
  const query = /* groq */ `*[_type == "openPosition" && isOpen == true]{ "slug": slug.current }.slug`
  return sanityFetch<string[]>({
    query,
    stega: false,
    perspective: "published"
  })
}

export async function fetchCareerPositionMeta(
  slug: string
): Promise<{ title: string } | null> {
  const query = /* groq */ `*[_type == "openPosition" && slug.current == $slug][0]{ title }`
  return sanityFetch<{ title: string } | null>({
    query,
    params: { slug },
    stega: false,
    perspective: "published"
  })
}
