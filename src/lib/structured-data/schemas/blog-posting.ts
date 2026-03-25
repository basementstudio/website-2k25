import { extractPlainText } from "../extract-text"

const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"

interface BlogPostData {
  _title: string
  _slug: string
  date: string
  _sys: { createdAt: string }
  intro?: { json: { content: unknown } } | null
  hero?: {
    heroImage?: { url: string; width: number; height: number } | null
  } | null
  authors?: { _title: string } | null
  categories?: { _title: string } | null
}

export const generateBlogPostingSchema = (post: BlogPostData) => {
  const description = post.intro?.json?.content
    ? extractPlainText(post.intro.json.content, 200)
    : undefined

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post._title,
    url: `${SITE_URL}/post/${post._slug}`,
    datePublished: post.date,
    dateModified: post._sys.createdAt,
    ...(description ? { description } : {}),
    ...(post.hero?.heroImage?.url
      ? {
          image: {
            "@type": "ImageObject",
            url: post.hero.heroImage.url,
            width: post.hero.heroImage.width,
            height: post.hero.heroImage.height
          }
        }
      : {}),
    ...(post.authors?._title
      ? {
          author: {
            "@type": "Person",
            name: post.authors._title
          }
        }
      : {}),
    ...(post.categories?._title
      ? { articleSection: post.categories._title }
      : {}),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL
    }
  }
}
