import { sanityFetch } from "@/service/sanity"
import { imageFragment, videoFragment } from "@/service/sanity/queries"
import type {
  PortableTextBlock,
  SanityImage,
  SanitySlug,
  SanityVideo
} from "@/service/sanity/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HomepageData {
  homepage: {
    introTitle: PortableTextBlock[] | null
    introSubtitle: PortableTextBlock[] | null
    capabilitiesIntro: PortableTextBlock[] | null
    featuredProjects: FeaturedProjectItem[] | null
    capabilities: SanityProjectCategory[] | null
    clients: SanityClient[] | null
  }
}

export interface FeaturedProjectItem {
  _key: string
  title: string | null
  excerpt: string | null
  project: {
    _id: string
    title: string
    slug: SanitySlug
    categories: Array<{ _id: string; title: string }> | null
  } | null
  cover: SanityImage | null
  coverVideo: SanityVideo | null
}

export interface SanityClient {
  _id: string
  title: string
  logo: SanityImage | null
  website: string | null
}

export interface SanityProjectCategory {
  _id: string
  title: string
  slug: SanitySlug
  description: string | null
  subcategories: Array<{ _key: string; title: string }> | null
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

const homepageQuery = /* groq */ `{
  "homepage": *[_type == "homepage"][0]{
    introTitle,
    introSubtitle,
    capabilitiesIntro,
    featuredProjects[]{
      _key,
      title,
      excerpt,
      project->{
        _id,
        title,
        slug,
        categories[]->{
          _id,
          title
        }
      },
      cover ${imageFragment},
      coverVideo ${videoFragment}
    },
    "capabilities": capabilities[]->{
      _id,
      title,
      slug,
      description,
      subcategories[]{ _key, title }
    },
    "clients": clients[]->{
      _id,
      title,
      logo ${imageFragment},
      website
    }
  }
}`

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchHomepage(): Promise<HomepageData> {
  return sanityFetch<HomepageData>({
    query: homepageQuery
  })
}

// ---------------------------------------------------------------------------
// Organization data (schema.org)
// ---------------------------------------------------------------------------

export interface OrganizationStructuredData {
  description: string | null
  foundingDate: string | number | null
  email: string | null
  addressCity: string | null
  addressRegion: string | null
  addressCountry: string | null
  logoUrl: string | null
  founders: Array<{
    name: string
    url: string | null
    jobTitle: string | null
  }>
  awards: Array<{
    title: string
    date: string | number | null
    projectName: string | null
  }>
  social: {
    github: string | null
    instagram: string | null
    twitter: string | null
    linkedIn: string | null
  }
}

const organizationQuery = /* groq */ `{
  "companyInfo": *[_type == "companyInfo"][0]{
    github,
    instagram,
    twitter,
    linkedIn
  },
  "awards": *[_type == "award" && defined(title)] | order(date desc){
    title,
    date,
    "projectName": project->title
  }
}`

export async function fetchOrganizationData(): Promise<OrganizationStructuredData> {
  const data = await sanityFetch<{
    companyInfo: {
      github: string | null
      instagram: string | null
      twitter: string | null
      linkedIn: string | null
    } | null
    awards: Array<{
      title: string
      date: string | null
      projectName: string | null
    }> | null
  }>({
    query: organizationQuery
  })

  return {
    description: null,
    foundingDate: null,
    email: null,
    addressCity: null,
    addressRegion: null,
    addressCountry: null,
    logoUrl: null,
    founders: [],
    awards: data.awards ?? [],
    social: {
      github: data.companyInfo?.github ?? null,
      instagram: data.companyInfo?.instagram ?? null,
      twitter: data.companyInfo?.twitter ?? null,
      linkedIn: data.companyInfo?.linkedIn ?? null
    }
  }
}
