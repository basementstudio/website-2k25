import { cacheLife } from "next/cache"

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
  slug: string
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
  return sanityFetch<PostDetail | null>({
    query,
    params: { slug },
    tag: "post.by-slug"
  })
}

export interface PostData {
  post: PostDetail
  relatedPosts: RelatedPost[]
}

/** Shared per-slug cache entry for the human post page and its `/ai` and `.md` mirrors. */
export async function getPostData(slug: string): Promise<PostData | null> {
  "use cache"
  const post = await fetchPostBySlug(slug)

  if (!post) {
    cacheLife("hours")
    return null
  }

  const relatedPosts = await fetchRelatedPosts(
    post.slug,
    post.categories?.map((category) => category.title) ?? []
  )

  return { post, relatedPosts }
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
    perspective: "published",
    tag: "post.index"
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
    params: { slug: currentSlug, titles: currentCategoryTitles },
    tag: "post.related"
  })

  return selectRelatedPosts({
    posts,
    currentSlug,
    currentCategoryTitles
  })
}

export async function fetchAllPostSlugs(): Promise<string[]> {
  const query = /* groq */ `*[_type == "post"]{ "slug": slug.current }.slug`
  return sanityFetchStatic<string[]>({
    query,
    perspective: "published",
    tag: "post.slugs.static-params"
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
    boundEmptyResult: true,
    tag: "post.meta"
  })
}
