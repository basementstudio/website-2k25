import { sanityFetch } from "@/service/sanity"
import type { PortableTextBlock } from "@/service/sanity/types"

export interface CompanyInfo {
  github: string | null
  instagram: string | null
  twitter: string | null
  linkedIn: string | null
  newsletter: PortableTextBlock[] | null
}

// Server-provided so the footer copyright year is in prerendered HTML (no
// hydration text shift). `new Date()` is fine inside "use cache". No explicit
// `cacheLife` — it inherits the project default (`sanity`, ~1y) so it doesn't
// drag every page that renders the footer/navbar down to a short lifetime. The
// year refreshes on the next deploy or Sanity-publish revalidation, which is
// plenty for a copyright year.
export async function fetchCurrentYear(): Promise<number> {
  "use cache"
  return new Date().getFullYear()
}

export async function fetchProjectsCount(): Promise<number> {
  "use cache"
  return sanityFetch<number>({
    query: /* groq */ `count(*[_type == "showcasePage"][0].projects)`
  })
}

export async function fetchPostsCount(): Promise<number> {
  "use cache"
  return sanityFetch<number>({
    query: /* groq */ `count(*[_type == "post"])`
  })
}

export async function fetchCompanyInfo(): Promise<CompanyInfo> {
  "use cache"
  return sanityFetch<CompanyInfo>({
    query: /* groq */ `*[_type == "companyInfo"][0] {
      github,
      instagram,
      twitter,
      linkedIn,
      newsletter
    }`
  })
}
