import { sanityFetchStatic } from "@/service/sanity"
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

export async function fetchLabProjects(): Promise<LabProject[]> {
  // Called from a server action (not a `"use cache"` scope), so use the non-Live
  // fetch — the Live `sanityFetch`'s `cacheTag()` throws outside `use cache`.
  return sanityFetchStatic<LabProject[]>({
    query: /* groq */ `*[_type == "labProject"] {
      title,
      url,
      description,
      cover ${imageFragment}
    }`,
    perspective: "published"
  })
}
