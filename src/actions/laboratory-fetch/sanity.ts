import { sanityFetch } from "@/service/sanity"
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
  return sanityFetch<LabProject[]>({
    query: /* groq */ `*[_type == "labProject"] {
      title,
      url,
      description,
      cover ${imageFragment}
    }`,
    tags: ["labProject"],
  })
}
