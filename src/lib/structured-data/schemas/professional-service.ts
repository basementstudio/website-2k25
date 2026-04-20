import type { PortableTextBlock } from "@/service/sanity/types"

import { extractPlainText } from "../extract-text"
import { ORGANIZATION_ID } from "./organization"

const SITE_URL = "https://basement.studio"

interface ServiceCategory {
  title: string
  description?: PortableTextBlock[] | null
}

const slugifyServiceName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const generateServicesWebPageSchema = (services: ServiceCategory[]) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}/services#webpage`,
  name: "Services",
  url: `${SITE_URL}/services`,
  mainEntity: {
    "@type": "OfferCatalog",
    "@id": `${SITE_URL}/services#catalog`,
    name: "Services",
    itemListElement: services.map((service) => {
      const serviceSlug = slugifyServiceName(service.title)
      const description = service.description
        ? extractPlainText(service.description, 200)
        : ""

      return {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          "@id": `${SITE_URL}/services#${serviceSlug}`,
          name: service.title,
          serviceType: service.title,
          areaServed: "Worldwide",
          provider: {
            "@id": ORGANIZATION_ID
          },
          ...(description ? { description } : {})
        }
      }
    })
  }
})
