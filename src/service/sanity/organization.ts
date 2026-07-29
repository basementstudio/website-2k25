import { COMPANY_FACTS } from "@/lib/company-facts"
import { sanityFetch } from "@/service/sanity"

/**
 * Data feeding the schema.org Organization node rendered on every page (see
 * `src/app/(site)/layout.tsx`). Stable identity facts come from
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

export async function fetchOrganizationData(): Promise<OrganizationStructuredData> {
  "use cache"
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
    description: COMPANY_FACTS.description,
    foundingDate: COMPANY_FACTS.foundingDate,
    // Contact emails published across the site (footer, contact page, contact
    // form). `email` is the primary general inbox; `contactPoints` exposes the
    // same plus the sales inbox as schema.org ContactPoints.
    email: "hello@basement.studio",
    contactPoints: [
      { email: "hello@basement.studio", contactType: "customer support" },
      { email: "sales@basement.studio", contactType: "sales" }
    ],
    // Country only — the published location is "Argentina", not a city.
    addressCity: null,
    addressRegion: null,
    addressCountry: COMPANY_FACTS.addressCountry,
    logoUrl: COMPANY_FACTS.logoUrl,
    founders: [],
    awards: data.awards ?? [],
    social: {
      github: data.companyInfo?.github ?? null,
      instagram: data.companyInfo?.instagram ?? null,
      twitter: data.companyInfo?.twitter ?? null,
      linkedIn: data.companyInfo?.linkedIn ?? null
    }
  }
}
