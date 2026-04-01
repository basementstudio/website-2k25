const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"

interface Founder {
  name: string
  url?: string | null
  jobTitle?: string | null
}

interface Award {
  title?: string | null
  date?: string | number | null
  projectName?: string | null
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
  awards?: Award[]
  social: {
    github: string | null
    instagram: string | null
    twitter: string | null
    linkedIn: string | null
  }
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`
const formatAward = (award: Award) => {
  const title =
    typeof award.title === "string" ? award.title.trim() : ""

  if (!title) return null

  const year =
    award.date !== null && award.date !== undefined
      ? new Date(award.date).getUTCFullYear()
      : null

  const projectName = award.projectName?.trim()
  const projectAlreadyIncludesYear =
    projectName && year ? projectName.endsWith(String(year)) : false

  if (projectName && year && projectAlreadyIncludesYear) {
    return `${title} - ${projectName}`
  }
  if (projectName && year) return `${title} - ${projectName} ${year}`
  if (projectName) return `${title} - ${projectName}`
  if (year) return `${title} ${year}`

  return title
}

export const generateOrganizationSchema = (data: OrganizationData) => {
  const sameAs = [
    data.social.github,
    data.social.instagram,
    data.social.twitter,
    data.social.linkedIn
  ].filter((v): v is string => Boolean(v))
  const award = [
    ...new Set(
      (data.awards ?? [])
        .map(formatAward)
        .filter((value): value is string => Boolean(value))
    )
  ]
  const hasAddress =
    data.addressCity || data.addressRegion || data.addressCountry

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
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
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL
})
