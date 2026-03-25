import { extractPlainText } from "../extract-text"

const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"

interface ServiceCategory {
  _title: string
  description?: { json: { content: unknown } } | null
}

interface Testimonial {
  name: string | null
  content?: { json: { content: unknown } } | null
  role?: { json: { content: unknown } } | null
  date?: string | null
}

export const generateProfessionalServiceSchema = (
  services: ServiceCategory[]
) => ({
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE_NAME,
  url: `${SITE_URL}/services`,
  provider: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Services",
    itemListElement: services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service._title,
        ...(service.description?.json?.content
          ? {
              description: extractPlainText(
                service.description.json.content,
                200
              )
            }
          : {})
      }
    }))
  }
})

export const generateReviewSchema = (t: Testimonial) => {
  const reviewBody = t.content?.json?.content
    ? extractPlainText(t.content.json.content)
    : null

  if (!reviewBody || !t.name) return null

  const jobTitle = t.role?.json?.content
    ? extractPlainText(t.role.json.content)
    : undefined

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: t.name,
      ...(jobTitle ? { jobTitle } : {})
    },
    reviewBody,
    ...(t.date ? { datePublished: t.date } : {}),
    itemReviewed: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL
    }
  }
}
