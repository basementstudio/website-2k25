import { COMPANY_FACTS } from "@/lib/company-facts"
import { fetchLayoutData } from "@/service/sanity/layout"

/**
 * Data feeding the schema.org Organization node rendered on every page (see
 * `src/lib/structured-data/page-json-ld.tsx`). Stable identity facts come from
 * `COMPANY_FACTS`; awards and social links come from Sanity so they stay in
 * sync with what the site publishes.
 */
export interface OrganizationStructuredData {
  description: string | null
  foundingDate: string | number | null
  email: string | null
  contactPoints: Array<{ email: string; contactType: string }>
  addressCity: string | null
  addressRegion: string | null
  addressCountry: string | null
  logoUrl: string | null
  founders: Array<{
    name: string
    url: string | null
    jobTitle: string | null
  }>
  awards: Array<{
    title: string
    date: string | number | null
    projectName: string | null
  }>
  social: {
    github: string | null
    instagram: string | null
    twitter: string | null
    linkedIn: string | null
  }
}

const getOrganizationFallback = (): OrganizationStructuredData => ({
  description: COMPANY_FACTS.description,
  foundingDate: COMPANY_FACTS.foundingDate,
  // `email` is the primary general inbox; `contactPoints` exposes the same
  // plus the sales inbox as schema.org ContactPoints.
  email: COMPANY_FACTS.contactEmail,
  contactPoints: [
    { email: COMPANY_FACTS.contactEmail, contactType: "customer support" },
    { email: COMPANY_FACTS.salesEmail, contactType: "sales" }
  ],
  addressCity: COMPANY_FACTS.addressCity,
  addressRegion: null,
  addressCountry: COMPANY_FACTS.addressCountry,
  logoUrl: COMPANY_FACTS.logoUrl,
  founders: [],
  awards: [],
  social: {
    github: null,
    instagram: null,
    twitter: null,
    linkedIn: null
  }
})

export async function fetchOrganizationData(): Promise<OrganizationStructuredData> {
  try {
    const { companyInfo, awards } = await fetchLayoutData()

    return {
      ...getOrganizationFallback(),
      awards: awards ?? [],
      social: {
        github: companyInfo?.github ?? null,
        instagram: companyInfo?.instagram ?? null,
        twitter: companyInfo?.twitter ?? null,
        linkedIn: companyInfo?.linkedIn ?? null
      }
    }
  } catch (error) {
    console.error(
      "Failed to fetch optional organization data; using stable fallback",
      error
    )
    return getOrganizationFallback()
  }
}
