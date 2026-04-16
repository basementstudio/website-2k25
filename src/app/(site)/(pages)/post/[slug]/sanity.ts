import { sanityFetch } from "@/service/sanity"
import { imageFragment } from "@/service/sanity/queries"
import type { PortableTextBlock, SanityImage } from "@/service/sanity/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostDetail {
  _id: string
  _createdAt: string
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
  categories: Array<{ title: string }> | null
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
        "videoUrl": file.asset->url
      }
    },
    categories[]->{ title, "slug": slug.current },
    authors[]->{ title },
    heroImage ${imageFragment},
    heroVideo
  }`
  return sanityFetch<PostDetail | null>({
    query,
    params: { slug }
  })
}

export async function fetchRelatedPosts(
  currentPostId: string
): Promise<RelatedPost[]> {
  const query = /* groq */ `*[_type == "post" && _id != $currentPostId] | order(date desc)[0...3]{
    _id,
    title,
    "slug": slug.current,
    date,
    heroImage ${imageFragment},
    categories[]->{ title }
  }`
  return sanityFetch<RelatedPost[]>({
    query,
    params: { currentPostId }
  })
}

export async function fetchAllPostSlugs(): Promise<string[]> {
  const query = /* groq */ `*[_type == "post"]{ "slug": slug.current }.slug`
  return sanityFetch<string[]>({
    query,
    stega: false
  })
}

export async function fetchPostMeta(
  slug: string
): Promise<{ title: string } | null> {
  const query = /* groq */ `*[_type == "post" && slug.current == $slug][0]{ title }`
  return sanityFetch<{ title: string } | null>({
    query,
    params: { slug },
    stega: false
  })
}
