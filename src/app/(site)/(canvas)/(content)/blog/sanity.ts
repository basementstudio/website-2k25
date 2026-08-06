import { sanityFetch, sanityFetchStatic } from "@/service/sanity"
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
  "use cache"
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
  "use cache"
  const query = /* groq */ `*[_type == "post"] | order(date desc)[0] ${postFields}`
  return sanityFetch<BlogPost | null>({
    query
  })
}

export async function fetchCategories(): Promise<BlogCategory[]> {
  "use cache"
  const query = /* groq */ `*[_type == "postCategory"] | order(title asc){
    title,
    "slug": slug.current
  }`
  return sanityFetch<BlogCategory[]>({
    query
  })
}

const categoriesNonEmptyQuery = /* groq */ `*[_type == "postCategory" && count(*[_type == "post" && references(^._id)]) > 0] | order(title asc){
    title,
    "slug": slug.current
  }`

export async function fetchCategoriesNonEmpty(
  opts: { forStaticParams?: boolean } = {}
): Promise<BlogCategory[]> {
  // generateStaticParams can't call the Live fetch (cacheTag needs "use cache").
  if (opts.forStaticParams) {
    return sanityFetchStatic<BlogCategory[]>({
      query: categoriesNonEmptyQuery,
      perspective: "published"
    })
  }
  return fetchCategoriesNonEmptyCached()
}

async function fetchCategoriesNonEmptyCached(): Promise<BlogCategory[]> {
  "use cache"
  return sanityFetch<BlogCategory[]>({
    query: categoriesNonEmptyQuery
  })
}

export async function fetchPostCount(): Promise<number> {
  "use cache"
  const query = /* groq */ `count(*[_type == "post"])`
  return sanityFetch<number>({
    query
  })
}

const postListForSchemaQuery = /* groq */ `
  *[_type == "post" && defined(slug.current)] | order(date desc){
    title,
    "slug": slug.current
  }
`

/** Lightweight title + slug list of all posts, for the CollectionPage schema. */
export async function fetchPostListForSchema(): Promise<
  Array<{ title: string; slug: string }>
> {
  "use cache"
  const posts = await sanityFetch<Array<{
    title: string
    slug: string
  }> | null>({
    query: postListForSchemaQuery
  })
  return posts ?? []
}

const postListByCategoryForSchemaQuery = /* groq */ `
  *[_type == "post" && defined(slug.current) && $categorySlug in categories[]->slug.current] | order(date desc){
    title,
    "slug": slug.current
  }
`

/** Same list scoped to one category, for category-page CollectionPage schema. */
export async function fetchPostListForSchemaByCategory(
  categorySlug: string
): Promise<Array<{ title: string; slug: string }>> {
  "use cache"
  const posts = await sanityFetch<Array<{
    title: string
    slug: string
  }> | null>({
    query: postListByCategoryForSchemaQuery,
    params: { categorySlug }
  })
  return posts ?? []
}
