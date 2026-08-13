import { COMPANY_FACTS } from "@/lib/company-facts"

import { ORGANIZATION_ID } from "./schemas/organization"

interface ServiceOffer {
  title: string
  /** Omitted on the homepage catalog, which has no per-service copy. */
  description?: string
  /** Only the /services page addresses individual services by `@id`. */
  id?: string
}

export const buildServiceOffer = ({
  title,
  description,
  id
}: ServiceOffer) => ({
  "@type": "Offer",
  itemOffered: {
    "@type": "Service",
    ...(id ? { "@id": id } : {}),
    name: title,
    serviceType: title,
    areaServed: COMPANY_FACTS.areaServed,
    provider: { "@id": ORGANIZATION_ID },
    ...(description ? { description } : {})
  }
})
