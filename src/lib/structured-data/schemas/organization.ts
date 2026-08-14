import { COMPANY_FACTS } from "@/lib/company-facts"
import { SITE_URL } from "@/lib/constants"

import { type Award, formatAwards } from "../format-award"

interface Founder {
  name: string
  url?: string | null
  jobTitle?: string | null
}

interface ContactPoint {
  email: string
  contactType: string
}

interface OrganizationData {
  description: string | null
  foundingDate: string | number | null
  email: string | null
  contactPoints?: ContactPoint[]
  addressCity: string | null
  addressRegion: string | null
  addressCountry: string | null
  logoUrl?: string | null
  founders: Founder[]
  awards?: Award[]
  social: {
    github: string | null
    instagram: string | null
    twitter: string | null
    linkedIn: string | null
  }
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`

export const generateOrganizationSchema = (data: OrganizationData) => {
  const sameAs = [
    data.social.github,
    data.social.instagram,
    data.social.twitter,
    data.social.linkedIn
  ].filter((v): v is string => Boolean(v))
  const award = formatAwards(data.awards)
  const hasAddress =
    data.addressCity || data.addressRegion || data.addressCountry

  const contactPoint = (data.contactPoints ?? [])
    .filter((cp) => Boolean(cp.email))
    .map((cp) => ({
      "@type": "ContactPoint",
      contactType: cp.contactType,
      email: cp.email
    }))

  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: COMPANY_FACTS.name,
    alternateName: [...COMPANY_FACTS.alternateNames],
    url: SITE_URL,
    areaServed: COMPANY_FACTS.areaServed,
    knowsAbout: [...COMPANY_FACTS.knowsAbout],
    ...(data.logoUrl ? { logo: data.logoUrl } : {}),
    ...(data.description ? { description: data.description } : {}),
    ...(data.foundingDate ? { foundingDate: String(data.foundingDate) } : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(contactPoint.length > 0 ? { contactPoint } : {}),
    // City/country come from COMPANY_FACTS; no street address is published.
    ...(hasAddress
      ? {
          address: {
            "@type": "PostalAddress",
            ...(data.addressCity ? { addressLocality: data.addressCity } : {}),
            ...(data.addressRegion
              ? { addressRegion: data.addressRegion }
              : {}),
            ...(data.addressCountry
              ? { addressCountry: data.addressCountry }
              : {})
          }
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(award.length > 0 ? { award } : {}),
    ...(data.founders.length > 0
      ? {
          founder: data.founders.map((f) => ({
            "@type": "Person",
            name: f.name,
            ...(f.url ? { url: f.url } : {}),
            ...(f.jobTitle ? { jobTitle: f.jobTitle } : {})
          }))
        }
      : {})
  }
}

export const generateWebSiteSchema = () => ({
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: COMPANY_FACTS.name,
  url: SITE_URL,
  publisher: { "@id": ORGANIZATION_ID }
})
