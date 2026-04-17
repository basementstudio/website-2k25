import type { MetadataRoute } from "next"

import { client } from "@/service/sanity/client"

const SITE_URL = "https://basement.studio"

const SITEMAP_QUERY = /* groq */ `{
  "posts": *[_type == "post" && defined(slug.current)]{
    "href": "/post/" + slug.current,
    _updatedAt
  },
  "projects": *[_type == "showcasePage"][0].projects[]->{
    "href": "/showcase/" + slug.current,
    _updatedAt
  },
  "positions": *[_type == "openPosition" && isOpen == true && defined(slug.current)]{
    "href": "/careers/" + slug.current,
    _updatedAt
  },
  "blogCategories": *[_type == "postCategory" && count(*[_type == "post" && references(^._id)]) > 0 && defined(slug.current)]{
    "href": "/blog/" + slug.current,
    _updatedAt
  }
}`

interface SitemapEntry {
  href: string
  _updatedAt: string
}

interface SitemapData {
  posts: SitemapEntry[] | null
  projects: SitemapEntry[] | null
  positions: SitemapEntry[] | null
  blogCategories: SitemapEntry[] | null
}

const staticRoutes: Array<{ href: string; priority: number }> = [
  { href: "/", priority: 1 },
  { href: "/showcase", priority: 0.9 },
  { href: "/services", priority: 0.9 },
  { href: "/blog", priority: 0.8 },
  { href: "/people", priority: 0.7 },
  { href: "/contact", priority: 0.7 },
  { href: "/lab", priority: 0.5 },
  { href: "/basketball", priority: 0.3 },
  { href: "/doom", priority: 0.3 }
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const data = await client.fetch<SitemapData>(SITEMAP_QUERY)

    const now = new Date()

    const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
      url: new URL(r.href, SITE_URL).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: r.priority
    }))

    const buildEntries = (
      entries: SitemapEntry[] | null,
      priority: number
    ): MetadataRoute.Sitemap =>
      (entries ?? []).map((e) => ({
        url: new URL(e.href, SITE_URL).toString(),
        lastModified: new Date(e._updatedAt),
        changeFrequency: "weekly",
        priority
      }))

    return [
      ...staticEntries,
      ...buildEntries(data.projects, 0.8),
      ...buildEntries(data.posts, 0.7),
      ...buildEntries(data.positions, 0.6),
      ...buildEntries(data.blogCategories, 0.6)
    ]
  } catch (error) {
    console.error("Failed to generate sitemap:", error)
    return []
  }
}
