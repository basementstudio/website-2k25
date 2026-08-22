import { sanityFetch, sanityFetchStatic } from "@/service/sanity"
import { imageFragment } from "@/service/sanity/queries"

export interface LabProject {
  title: string
  url: string
  description: string | null
  cover: {
    asset: {
      url: string
      metadata: {
        dimensions: { width: number; height: number }
        lqip: string
      }
    }
  } | null
}

const labProjectsQuery = /* groq */ `*[_type == "labProject"] {
  title,
  url,
  description,
  cover ${imageFragment}
}`

export async function fetchLabProjects(): Promise<LabProject[]> {
  // Called from a server action (not a `"use cache"` scope), so use the non-Live
  // fetch — the Live `sanityFetch`'s `cacheTag()` throws outside `use cache`.
  return sanityFetchStatic<LabProject[]>({
    query: labProjectsQuery,
    perspective: "published"
  })
}

/** For `/api/lab.md` — caller provides a `"use cache"` scope. */
export async function fetchLabProjectsPublished(): Promise<LabProject[]> {
  return sanityFetch<LabProject[]>({
    query: labProjectsQuery,
    perspective: "published"
  })
}
