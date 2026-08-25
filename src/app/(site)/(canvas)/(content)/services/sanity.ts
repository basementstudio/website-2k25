import { sanityFetchCached } from "@/service/sanity"
import { imageFragment } from "@/service/sanity/queries"
import type { PortableTextBlock, SanityImage } from "@/service/sanity/types"

// Types

export interface ServiceCategory {
  _key: string
  title: string
  description: PortableTextBlock[] | null
}

export interface Venture {
  _key: string
  title: string
  content: PortableTextBlock[] | null
  image: SanityImage | null
}

export interface ServiceAward {
  _id: string
  title: string
  date: string
  awardUrl: string | null
  projectName: string | null
  certificate: SanityImage | null
}

export interface ServiceTestimonial {
  _id: string
  name: string
  handle: string | null
  content: string | null
  avatar: SanityImage | null
  date: string
  role: PortableTextBlock[] | string | null
}

export type ServiceAwardMarkdown = Omit<ServiceAward, "certificate">

export interface ServicesPageData {
  intro: PortableTextBlock[] | null
  heroImage: SanityImage | null
  ventures: Venture[]
  serviceCategories: ServiceCategory[]
}

// Queries

const servicesPageQuery = /* groq */ `
  *[_type == "servicesPage"][0]{
    intro,
    heroImage ${imageFragment},
    ventures[]{
      _key,
      title,
      content,
      image ${imageFragment}
    },
    serviceCategories[]{
      _key,
      title,
      description
    }
  }
`

const awardsQuery = /* groq */ `
  *[_type == "award"] | order(date desc) {
    _id,
    title,
    date,
    awardUrl,
    "projectName": coalesce(project->title, projectFallback),
    certificate ${imageFragment}
  }
`

// Same as awardsQuery, minus `certificate` — the `.md` route never renders it.
const awardsForMarkdownQuery = /* groq */ `
  *[_type == "award"] | order(date desc) {
    _id,
    title,
    date,
    awardUrl,
    "projectName": coalesce(project->title, projectFallback)
  }
`

const testimonialQuery = /* groq */ `
  *[_type == "testimonial"][0]{
    _id,
    name,
    handle,
    content,
    avatar ${imageFragment},
    date,
    role
  }
`

// Fetchers

export async function fetchServicesPage(
  /** Pass `published: true` for non-draft contexts (e.g. the `.md` endpoint) — disables stega so output isn't polluted with invisible chars. */
  options?: { published?: boolean }
): Promise<ServicesPageData | null> {
  if (options?.published) {
    return sanityFetchCached<ServicesPageData | null>({
      query: servicesPageQuery,
      perspective: "published",
      tag: "services.page.markdown"
    })
  }
  return sanityFetchCached<ServicesPageData | null>({
    query: servicesPageQuery,
    tag: "services.page"
  })
}

export async function fetchAwards(): Promise<ServiceAward[]> {
  const result = await sanityFetchCached<ServiceAward[] | null>({
    query: awardsQuery,
    tag: "services.awards"
  })
  return result ?? []
}

export async function fetchAwardsForMarkdown(): Promise<
  ServiceAwardMarkdown[]
> {
  const result = await sanityFetchCached<ServiceAwardMarkdown[] | null>({
    query: awardsForMarkdownQuery,
    perspective: "published",
    tag: "services.awards.markdown"
  })
  return result ?? []
}

export async function fetchTestimonial(
  /** Pass `published: true` for non-draft contexts (e.g. the `.md` endpoint) — disables stega so output isn't polluted with invisible chars. */
  options?: { published?: boolean }
): Promise<ServiceTestimonial | null> {
  return sanityFetchCached<ServiceTestimonial | null>({
    query: testimonialQuery,
    tag: options?.published
      ? "services.testimonial.markdown"
      : "services.testimonial",
    ...(options?.published ? { perspective: "published" } : {})
  })
}
