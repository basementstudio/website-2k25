import { sanityFetch } from "@/service/sanity"
import { imageFragment } from "@/service/sanity/queries"
import type { PortableTextBlock, SanityImage } from "@/service/sanity/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BlogPost {
  _id: string
  title: string
  slug: string
  categories: Array<{ title: string; slug: string }> | null
  date: string | null
  intro: PortableTextBlock[] | null
  heroImage: SanityImage | null
  heroVideo: string | null
}

export interface BlogCategory {
  title: string
  slug: string
}

// ---------------------------------------------------------------------------
// Fragments
// ---------------------------------------------------------------------------

const postFields = /* groq */ `{
  _id,
  title,
  "slug": slug.current,
  categories[]->{ title, "slug": slug.current },
  date,
  intro,
  heroImage ${imageFragment},
  heroVideo
}`

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function fetchPosts(
  category?: string
): Promise<{ posts: BlogPost[]; total: number }> {
  if (category) {
    const query = /* groq */ `{
      "posts": *[_type == "post" && $category in categories[]->slug.current] | order(date desc) ${postFields},
      "total": count(*[_type == "post" && $category in categories[]->slug.current])
    }`
    return sanityFetch<{ posts: BlogPost[]; total: number }>({
      query,
      params: { category }
    })
  }

  const query = /* groq */ `{
    "posts": *[_type == "post"] | order(date desc)[1..-1] ${postFields},
    "total": count(*[_type == "post"])
  }`
  return sanityFetch<{ posts: BlogPost[]; total: number }>({
    query
  })
}

export async function fetchFeaturedPost(): Promise<BlogPost | null> {
  const query = /* groq */ `*[_type == "post"] | order(date desc)[0] ${postFields}`
  return sanityFetch<BlogPost | null>({
    query
  })
}

export async function fetchCategories(): Promise<BlogCategory[]> {
  const query = /* groq */ `*[_type == "postCategory"] | order(title asc){
    title,
    "slug": slug.current
  }`
  return sanityFetch<BlogCategory[]>({
    query
  })
}

export async function fetchCategoriesNonEmpty(
  opts: { forStaticParams?: boolean } = {}
): Promise<BlogCategory[]> {
  const query = /* groq */ `*[_type == "postCategory" && count(*[_type == "post" && references(^._id)]) > 0] | order(title asc){
    title,
    "slug": slug.current
  }`
  return sanityFetch<BlogCategory[]>({
    query,
    ...(opts.forStaticParams
      ? { stega: false, perspective: "published" as const }
      : {})
  })
}

export async function fetchPostCount(): Promise<number> {
  const query = /* groq */ `count(*[_type == "post"])`
  return sanityFetch<number>({
    query
  })
}
