import { sanityFetch } from "@/service/sanity"
import { imageFragment } from "@/service/sanity/queries"
import type { PortableTextBlock, SanityImage } from "@/service/sanity/types"

// Types

interface SocialNetwork {
  platform: string
  url: string
}

export interface PersonItem {
  title: string
  department: { title: string } | null
  role: string | null
  image: SanityImage | null
  socialNetworks: SocialNetwork[]
}

export interface PersonDisplay {
  title: string
  department: string | null
  role: string | null
  image: {
    url: string
    width: number
    height: number
    alt: string | null
    blurDataURL: string | null
  } | null
  socialNetworks: SocialNetwork[]
}

export interface ValueItem {
  _key: string
  title: string
  description: PortableTextBlock[] | null
  image: SanityImage | null
}

export interface OpenPositionItem {
  title: string
  slug: string
  type: string | null
  location: string | null
  isOpen: boolean
}

export interface PeoplePageData {
  title: string | null
  subheading1: PortableTextBlock[] | null
  subheading2: PortableTextBlock[] | null
  preOpenPositionsSideImages: SanityImage[] | null
  preOpenPositionsText: PortableTextBlock[] | null
}

// Queries

const peoplePageQuery = /* groq */ `
  *[_type == "peoplePage"][0]{
    title,
    subheading1,
    subheading2,
    preOpenPositionsSideImages[] ${imageFragment},
    preOpenPositionsText
  }
`

const peopleQuery = /* groq */ `
  *[_type == "person"] | order(title asc) {
    title,
    department->{ title },
    role,
    image ${imageFragment},
    socialNetworks[]{ platform, url }
  }
`

const valuesQuery = /* groq */ `
  *[_type == "value"] | order(_createdAt asc) {
    _key,
    title,
    description,
    image ${imageFragment}
  }
`

const openPositionsQuery = /* groq */ `
  *[_type == "openPosition"] | order(
    select(
      type == "Management and Strategy" => 0,
      type == "Design" => 1,
      type == "Development" => 2,
      3
    ) asc,
    isOpen desc,
    title asc
  ) {
    title,
    "slug": slug.current,
    type,
    location,
    isOpen
  }
`

// Fetchers

export async function fetchPeoplePage(): Promise<PeoplePageData | null> {
  return sanityFetch<PeoplePageData | null>({
    query: peoplePageQuery
  })
}

export async function fetchPeople(): Promise<PersonItem[]> {
  const result = await sanityFetch<PersonItem[] | null>({
    query: peopleQuery
  })
  return result ?? []
}

export async function fetchValues(): Promise<ValueItem[]> {
  const result = await sanityFetch<ValueItem[] | null>({
    query: valuesQuery
  })
  return result ?? []
}

export async function fetchOpenPositions(): Promise<OpenPositionItem[]> {
  const result = await sanityFetch<OpenPositionItem[] | null>({
    query: openPositionsQuery
  })
  return result ?? []
}
