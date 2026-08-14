import { SITE_URL } from "@/lib/constants"
import type { PortableTextBlock } from "@/service/sanity/types"

import { extractPlainText } from "../extract-text"
import { buildServiceOffer } from "../service-offer"

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
  "@type": "WebPage",
  "@id": `${SITE_URL}/services#webpage`,
  name: "Services",
  url: `${SITE_URL}/services`,
  mainEntity: {
    "@type": "OfferCatalog",
    "@id": `${SITE_URL}/services#catalog`,
    name: "Services",
    itemListElement: services.map((service) =>
      buildServiceOffer({
        title: service.title,
        id: `${SITE_URL}/services#${slugifyServiceName(service.title)}`,
        description: service.description
          ? extractPlainText(service.description, 200)
          : undefined
      })
    )
  }
})
