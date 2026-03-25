const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"

interface Founder {
  name: string
  url?: string | null
}

interface OrganizationData {
  description: string | null
  foundingDate: string | number | null
  email: string | null
  addressCity: string | null
  addressRegion: string | null
  addressCountry: string | null
  logo?: { url: string } | null
  founders: Founder[]
  social: {
    github: string | null
    instagram: string | null
    twitter: string | null
    linkedIn: string | null
  }
}

export const generateOrganizationSchema = (data: OrganizationData) => {
  const sameAs = [
    data.social.github,
    data.social.instagram,
    data.social.twitter,
    data.social.linkedIn
  ].filter((v): v is string => Boolean(v))

  const hasAddress =
    data.addressCity || data.addressRegion || data.addressCountry

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    ...(data.logo?.url ? { logo: data.logo.url } : {}),
    ...(data.description ? { description: data.description } : {}),
    ...(data.foundingDate
      ? { foundingDate: String(data.foundingDate) }
      : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(hasAddress
      ? {
          address: {
            "@type": "PostalAddress",
            ...(data.addressCity
              ? { addressLocality: data.addressCity }
              : {}),
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
    ...(data.founders.length > 0
      ? {
          founder: data.founders.map((f) => ({
            "@type": "Person",
            name: f.name,
            ...(f.url ? { url: f.url } : {})
          }))
        }
      : {})
  }
}

export const generateWebSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL
})
