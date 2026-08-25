import { sanityFetchCached } from "@/service/sanity"
import { imageFragment } from "@/service/sanity/queries"
import type { PortableTextBlock, SanityImage } from "@/service/sanity/types"

// Types

export interface SocialNetwork {
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

export interface PersonMarkdownItem {
  title: string
  department: { title: string } | null
  role: string | null
  socialNetworks: SocialNetwork[]
}

// Same as peopleQuery, minus `image` — the `.md` route never renders it.
const peopleForMarkdownQuery = /* groq */ `
  *[_type == "person"] | order(title asc) {
    title,
    department->{ title },
    role,
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

export type ValueMarkdownItem = Omit<ValueItem, "image">

// Same as valuesQuery, minus `image` — the `.md` route never renders it.
const valuesForMarkdownQuery = /* groq */ `
  *[_type == "value"] | order(_createdAt asc) {
    _key,
    title,
    description
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
  return sanityFetchCached<PeoplePageData | null>({
    query: peoplePageQuery,
    tag: "people.page"
  })
}

export async function fetchPeople(): Promise<PersonItem[]> {
  const result = await sanityFetchCached<PersonItem[] | null>({
    query: peopleQuery,
    tag: "people.roster"
  })
  return result ?? []
}

export async function fetchPeopleForMarkdown(): Promise<PersonMarkdownItem[]> {
  const result = await sanityFetchCached<PersonMarkdownItem[] | null>({
    query: peopleForMarkdownQuery,
    perspective: "published",
    tag: "people.roster.markdown"
  })
  return result ?? []
}

export async function fetchValues(): Promise<ValueItem[]> {
  const result = await sanityFetchCached<ValueItem[] | null>({
    query: valuesQuery,
    tag: "people.values"
  })
  return result ?? []
}

export async function fetchValuesForMarkdown(): Promise<ValueMarkdownItem[]> {
  const result = await sanityFetchCached<ValueMarkdownItem[] | null>({
    query: valuesForMarkdownQuery,
    perspective: "published",
    tag: "people.values.markdown"
  })
  return result ?? []
}

export async function fetchOpenPositions(): Promise<OpenPositionItem[]> {
  const result = await sanityFetchCached<OpenPositionItem[] | null>({
    query: openPositionsQuery,
    tag: "people.open-positions"
  })
  return result ?? []
}
