import type { PortableTextBlock, SanityImage } from "@/service/sanity/types"

import { extractPlainText } from "../extract-text"
import { createImageObject } from "../image-object"

const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"
const PUBLISHER_LOGO = {
  "@type": "ImageObject" as const,
  url: "https://assets.basehub.com/dd0abb74/a8d4b8ac866cf524bba8c668e1c0316f/basementlogo.svg",
  width: 112,
  height: 112,
  caption: "basement.studio logo"
}

interface BlogPostData {
  title: string
  slug: string
  date: string | null
  createdAt?: string | null
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
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    url,
    mainEntityOfPage: url,
    inLanguage: "en",
    ...(post.date ? { datePublished: post.date } : {}),
    ...(post.createdAt ? { dateModified: post.createdAt } : {}),
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
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: PUBLISHER_LOGO
    }
  }
}
