import { SITE_URL } from "@/lib/constants"
import type { PortableTextBlock, SanityImage } from "@/service/sanity/types"

import { extractPlainText } from "../extract-text"
import { createImageObject } from "../image-object"
import { ORGANIZATION_ID } from "./organization"

interface BlogPostData {
  title: string
  slug: string
  date: string | null
  modifiedAt?: string | null
  intro?: PortableTextBlock[] | null
  heroImage?: SanityImage | null
  authors?: { title: string; url?: string | null }[] | null
  categories?: { title: string }[] | null
}

export const generateBlogPostingSchema = (post: BlogPostData) => {
  const description = post.intro ? extractPlainText(post.intro) : undefined
  const image = createImageObject(post.heroImage)
  const url = `${SITE_URL}/post/${post.slug}`
  const articleSection = post.categories
    ?.map((category) => category.title)
    .filter((value): value is string => Boolean(value))

  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    url,
    mainEntityOfPage: url,
    inLanguage: "en",
    ...(post.date ? { datePublished: post.date } : {}),
    ...(post.modifiedAt ? { dateModified: post.modifiedAt } : {}),
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(post.authors && post.authors.length > 0
      ? {
          author:
            post.authors.length === 1
              ? {
                  "@type": "Person",
                  name: post.authors[0].title,
                  ...(post.authors[0].url ? { url: post.authors[0].url } : {})
                }
              : post.authors.map((a) => ({
                  "@type": "Person",
                  name: a.title,
                  ...(a.url ? { url: a.url } : {})
                }))
        }
      : {}),
    ...(articleSection?.length ? { articleSection } : {}),
    publisher: { "@id": ORGANIZATION_ID }
  }
}
