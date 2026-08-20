import { COMPANY_FACTS } from "@/lib/company-facts"
import { sanityFetch } from "@/service/sanity"

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

const organizationQuery = /* groq */ `{
  "companyInfo": *[_type == "companyInfo"][0]{
    github,
    instagram,
    twitter,
    linkedIn
  },
  "awards": *[_type == "award" && defined(title)] | order(date desc){
    title,
    date,
    "projectName": project->title
  }
}`

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
  "use cache"

  try {
    const data = await sanityFetch<{
      companyInfo: {
        github: string | null
        instagram: string | null
        twitter: string | null
        linkedIn: string | null
      } | null
      awards: Array<{
        title: string
        date: string | null
        projectName: string | null
      }> | null
    }>({
      query: organizationQuery
    })

    return {
      ...getOrganizationFallback(),
      awards: data.awards ?? [],
      social: {
        github: data.companyInfo?.github ?? null,
        instagram: data.companyInfo?.instagram ?? null,
        twitter: data.companyInfo?.twitter ?? null,
        linkedIn: data.companyInfo?.linkedIn ?? null
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
