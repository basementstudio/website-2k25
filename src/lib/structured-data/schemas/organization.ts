const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"

interface Founder {
  name: string
  url?: string | null
}

interface OrganizationData {
  description: string
  foundingDate: string
  email: string
  addressCity: string
  addressRegion: string
  addressCountry: string
  logo?: { url: string } | null
  founders: Founder[]
  social: {
    github: string
    instagram: string
    twitter: string
    linkedIn: string
  }
}

export const generateOrganizationSchema = (data: OrganizationData) => {
  const sameAs = [
    data.social.github,
    data.social.instagram,
    data.social.twitter,
    data.social.linkedIn
  ].filter(Boolean)

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    ...(data.logo?.url ? { logo: data.logo.url } : {}),
    description: data.description,
    foundingDate: data.foundingDate,
    email: data.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: data.addressCity,
      addressRegion: data.addressRegion,
      addressCountry: data.addressCountry
    },
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
