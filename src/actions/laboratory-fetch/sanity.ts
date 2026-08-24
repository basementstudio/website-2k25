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

export async function fetchLabProjects(
  /** Pass `published: true` inside a `"use cache"` scope (e.g. the `.md` build) — outside one the Live fetch's `cacheTag()` throws, so the default is the non-Live client the server action needs. */
  options?: { published?: boolean }
): Promise<LabProject[]> {
  const fetch = options?.published ? sanityFetch : sanityFetchStatic
  return fetch<LabProject[]>({
    query: labProjectsQuery,
    perspective: "published"
  })
}
