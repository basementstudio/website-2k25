import { ORGANIZATION_ID } from "./organization"

const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"

const DESCRIPTION =
  "A digital studio & branding powerhouse making cool shit that performs."

interface ProfessionalServiceData {
  /**
   * Service category titles the studio offers (e.g. branding, design,
   * engineering). Pass the real capabilities from the homepage CMS data so the
   * schema stays in sync with what the site actually advertises.
   */
  services?: string[]
  email?: string | null
}

export const PROFESSIONAL_SERVICE_ID = `${SITE_URL}/#professionalservice`

/**
 * Primary entity describing basement.studio as a ProfessionalService. Linked to
 * the Organization node via `@id` so consumers can resolve both. Services are
 * exposed through an OfferCatalog of Service offers.
 */
export const generateProfessionalServiceSchema = (
  data: ProfessionalServiceData = {}
) => {
  const services = (data.services ?? []).filter((s) => Boolean(s?.trim()))

  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": PROFESSIONAL_SERVICE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: DESCRIPTION,
    image: `${SITE_URL}/images/opengraph-image.gif`,
    areaServed: "Worldwide",
    parentOrganization: { "@id": ORGANIZATION_ID },
    ...(data.email ? { email: data.email } : {}),
    ...(services.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Services",
            itemListElement: services.map((service) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: service,
                serviceType: service,
                provider: { "@id": ORGANIZATION_ID }
              }
            }))
          }
        }
      : {})
  }
}
