import { extractPlainText } from "../extract-text"

const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"

interface BlogPostData {
  _title: string
  _slug: string
  date: string | null
  _sys: { createdAt: string }
  intro?: { json: { content: unknown } } | null
  hero?: {
    heroImage?: {
      url: string
      width: number | null
      height: number | null
    } | null
  } | null
  authors?: { _title: string }[] | null
  categories?: { _title: string }[] | null
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
    ...(post.date ? { datePublished: post.date } : {}),
    dateModified: post._sys.createdAt,
    ...(description ? { description } : {}),
    ...(post.hero?.heroImage?.url
      ? {
          image: {
            "@type": "ImageObject",
            url: post.hero.heroImage.url,
            ...(post.hero.heroImage.width
              ? { width: post.hero.heroImage.width }
              : {}),
            ...(post.hero.heroImage.height
              ? { height: post.hero.heroImage.height }
              : {})
          }
        }
      : {}),
    ...(post.authors && post.authors.length > 0
      ? {
          author:
            post.authors.length === 1
              ? { "@type": "Person", name: post.authors[0]._title }
              : post.authors.map((a) => ({
                  "@type": "Person",
                  name: a._title
                }))
        }
      : {}),
    ...(post.categories && post.categories.length > 0
      ? { articleSection: post.categories.map((c) => c._title).join(", ") }
      : {}),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL
    }
  }
}
