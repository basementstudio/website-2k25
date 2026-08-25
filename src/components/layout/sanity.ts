import { cacheLife } from "next/cache"

import { fetchLayoutData } from "@/service/sanity/layout"
import type { PortableTextBlock } from "@/service/sanity/types"

export interface CompanyInfo {
  github: string | null
  instagram: string | null
  twitter: string | null
  linkedIn: string | null
  newsletter: PortableTextBlock[] | null
}

export async function fetchCurrentYear(): Promise<number> {
  "use cache"
  cacheLife("days")
  return new Date().getFullYear()
}

export async function fetchProjectsCount(): Promise<number> {
  const { projectsCount } = await fetchLayoutData()
  return projectsCount
}

export async function fetchPostsCount(): Promise<number> {
  const { postsCount } = await fetchLayoutData()
  return postsCount
}

// Navbar/Footer read these fields unguarded, so absorb a missing `companyInfo`
// singleton here rather than letting it throw through the whole layout.
const EMPTY_COMPANY_INFO: CompanyInfo = {
  github: null,
  instagram: null,
  twitter: null,
  linkedIn: null,
  newsletter: null
}

export async function fetchCompanyInfo(): Promise<CompanyInfo> {
  const { companyInfo } = await fetchLayoutData()
  return companyInfo ?? EMPTY_COMPANY_INFO
}
