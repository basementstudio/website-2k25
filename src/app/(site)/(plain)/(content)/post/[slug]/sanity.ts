import {
  sanityFetch,
  sanityFetchCached,
  sanityFetchStatic
} from "@/service/sanity"
import { imageFragment, muxVideoFragment } from "@/service/sanity/queries"
import type { PortableTextBlock, SanityImage } from "@/service/sanity/types"

import { selectRelatedPosts } from "./related-posts.logic"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostDetail {
  _id: string
  _createdAt: string
  _updatedAt: string
  title: string
  slug: string
  date: string | null
  intro: PortableTextBlock[] | null
  content: PortableTextBlock[] | null
  categories: Array<{ title: string; slug: string }> | null
  authors: Array<{ title: string }> | null
  heroImage: SanityImage | null
  heroVideo: string | null
}

export interface RelatedPost {
  _id: string
  title: string
  slug: string
  date: string | null
  heroImage: SanityImage | null
  categories: Array<{ title: string; slug: string }> | null
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export async function fetchPostBySlug(
  slug: string,
  /** Pass `published: true` inside a `"use cache"` scope (e.g. the `.md` build) — pins published perspective so stega stays off and no dynamic APIs are touched. */
  options?: { published?: boolean }
): Promise<PostDetail | null> {
  const query = /* groq */ `*[_type == "post" && slug.current == $slug][0]{
    _id,
    _createdAt,
    _updatedAt,
    title,
    "slug": slug.current,
    date,
    intro,
    content[]{
      ...,
      _type == "image" => {
        ...,
        asset->{url, metadata{dimensions{width, height}, lqip}}
      },
      _type == "quoteWithAuthor" => {
        ...,
        avatar{
          asset->{url, metadata{dimensions{width, height}, lqip}},
          alt
        }
      },
      _type == "gridGallery" => {
        ...,
        images[]{
          asset->{url, metadata{dimensions{width, height}, lqip}},
          alt
        }
      },
      _type == "videoEmbed" => {
        ...,
        "videoUrl": file.asset->url,
        muxVideo ${muxVideoFragment}
      }
    },
    categories[]->{ title, "slug": slug.current },
    authors[]->{ title },
    heroImage ${imageFragment},
    heroVideo
  }`
  if (options?.published) {
    return sanityFetch<PostDetail | null>({
      query,
      params: { slug },
      perspective: "published"
    })
  }
  return sanityFetch<PostDetail | null>({
    query,
    params: { slug }
  })
}

export interface PostIndexEntry {
  title: string
  slug: string
  date: string | null
}

export async function fetchAllPostsForIndex(): Promise<PostIndexEntry[]> {
  const query = /* groq */ `*[_type == "post" && defined(slug.current)] | order(date desc){
    title,
    "slug": slug.current,
    date
  }`
  return sanityFetchCached<PostIndexEntry[]>({
    query,
    perspective: "published"
  })
}

export async function fetchRelatedPosts(
  currentSlug: string,
  currentCategoryTitles: string[]
): Promise<RelatedPost[]> {
  if (currentCategoryTitles.length === 0) return []

  // Filter + range pushed into GROQ instead of fetching all posts to keep 3.
  const query = /* groq */ `*[
    _type == "post" &&
    slug.current != $slug &&
    count(categories[@->title in $titles]) > 0
  ] | order(date desc)[0...3]{
    _id,
    title,
    "slug": slug.current,
    date,
    heroImage ${imageFragment},
    categories[]->{ title, "slug": slug.current }
  }`
  const posts = await sanityFetch<RelatedPost[]>({
    query,
    params: { slug: currentSlug, titles: currentCategoryTitles }
  })

  return selectRelatedPosts({
    posts,
    currentSlug,
    currentCategoryTitles
  })
}

export interface RelatedPostMarkdown {
  title: string
  slug: string
  date: string | null
}

/**
 * Same selection as fetchRelatedPosts, minus heroImage. Published perspective
 * keeps stega out. Call from a `"use cache"` scope (e.g. the `.md` build).
 */
export async function fetchRelatedPostsForMarkdown(
  currentSlug: string,
  currentCategoryTitles: string[]
): Promise<RelatedPostMarkdown[]> {
  if (currentCategoryTitles.length === 0) return []

  const query = /* groq */ `*[
    _type == "post" &&
    slug.current != $slug &&
    count(categories[@->title in $titles]) > 0
  ] | order(date desc)[0...3]{
    _id,
    title,
    "slug": slug.current,
    date,
    categories[]->{ title, "slug": slug.current }
  }`
  const posts = await sanityFetch<Array<Omit<RelatedPost, "heroImage">>>({
    query,
    params: { slug: currentSlug, titles: currentCategoryTitles },
    perspective: "published"
  })
  if (!posts) return []

  return selectRelatedPosts({
    posts: posts.map((post) => ({ ...post, heroImage: null })),
    currentSlug,
    currentCategoryTitles
  }).map(({ title, slug, date }) => ({ title, slug, date }))
}

export async function fetchAllPostSlugs(): Promise<string[]> {
  const query = /* groq */ `*[_type == "post"]{ "slug": slug.current }.slug`
  return sanityFetchStatic<string[]>({
    query,
    perspective: "published"
  })
}

export async function fetchPostMeta(
  slug: string
): Promise<{ title: string; intro: PortableTextBlock[] | null } | null> {
  const query = /* groq */ `*[_type == "post" && slug.current == $slug][0]{ title, intro }`
  return sanityFetchCached<{
    title: string
    intro: PortableTextBlock[] | null
  } | null>({
    query,
    params: { slug },
    perspective: "published",
    boundEmptyResult: true
  })
}
