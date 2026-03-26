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
    query: homepageQuery,
    tags: ["homepage", "client", "projectCategory", "project"]
  })
}
