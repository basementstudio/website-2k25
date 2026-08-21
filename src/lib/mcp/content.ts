import { fetchAllOpenPositionsForIndex } from "@/app/(site)/(plain)/(content)/careers/[slug]/sanity"
import { fetchAllPostsForIndex } from "@/app/(site)/(plain)/(content)/post/[slug]/sanity"
import { fetchAllProjectsForIndex } from "@/app/(site)/(plain)/(content)/showcase/[slug]/sanity"
import { SITE_URL } from "@/lib/constants"

export interface ContentIndexEntry {
  title: string
  type: "page" | "post" | "project" | "position"
  mdPath: string
  url: string
}

// Keep in sync with the singleton entries in markdown-proxy.config.ts.
const STATIC_PAGES: Array<{ title: string; mdPath: string }> = [
  { title: "Home", mdPath: "/index.md" },
  { title: "Services", mdPath: "/services.md" },
  { title: "People", mdPath: "/people.md" },
  { title: "Showcase", mdPath: "/showcase.md" },
  { title: "Blog", mdPath: "/blog.md" },
  { title: "Lab", mdPath: "/lab.md" },
  { title: "FAQ", mdPath: "/faq.md" },
  { title: "Contact", mdPath: "/contact.md" }
]

export async function fetchContentIndex(): Promise<ContentIndexEntry[]> {
  const [posts, projects, positions] = await Promise.all([
    fetchAllPostsForIndex(),
    fetchAllProjectsForIndex(),
    fetchAllOpenPositionsForIndex()
  ])

  const entry = (
    title: string,
    type: ContentIndexEntry["type"],
    mdPath: string
  ): ContentIndexEntry => ({
    title,
    type,
    mdPath,
    url: `${SITE_URL}${mdPath}`
  })

  return [
    ...STATIC_PAGES.map((page) => entry(page.title, "page", page.mdPath)),
    ...posts.map((post) => entry(post.title, "post", `/post/${post.slug}.md`)),
    ...projects.map((project) =>
      entry(project.title, "project", `/showcase/${project.slug}.md`)
    ),
    ...positions.map((position) =>
      entry(position.title, "position", `/careers/${position.slug}.md`)
    )
  ]
}
