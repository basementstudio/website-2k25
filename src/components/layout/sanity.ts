import { sanityFetch } from "@/service/sanity"
import type { PortableTextBlock } from "@/service/sanity/types"

export interface CompanyInfo {
  github: string | null
  instagram: string | null
  twitter: string | null
  linkedIn: string | null
  newsletter: PortableTextBlock[] | null
}

export async function fetchProjectsCount(): Promise<number> {
  return sanityFetch<number>({
    query: /* groq */ `count(*[_type == "showcasePage"][0].projects)`,
    tags: ["showcasePage"]
  })
}

export async function fetchPostsCount(): Promise<number> {
  return sanityFetch<number>({
    query: /* groq */ `count(*[_type == "post"])`,
    tags: ["post"]
  })
}

export async function fetchCompanyInfo(): Promise<CompanyInfo> {
  return sanityFetch<CompanyInfo>({
    query: /* groq */ `*[_type == "companyInfo"][0] {
      github,
      instagram,
      twitter,
      linkedIn,
      newsletter
    }`,
    tags: ["companyInfo"]
  })
}
