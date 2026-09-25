import { fetchOrganizationData } from "@/service/sanity/organization"

import { generateOrganizationSchema } from "./schemas/organization"

export interface SchemaNode {
  "@type": string
  [key: string]: unknown
}

interface PageJsonLdProps {
  nodes?: (SchemaNode | null)[]
}

// One @graph per page so `@id` references to the inlined Organization node
// resolve. Layouts can't see their children's nodes, so every route renders it.
export const PageJsonLd = async ({ nodes = [] }: PageJsonLdProps) => {
  const orgData = await fetchOrganizationData()
  const graph = [generateOrganizationSchema(orgData), ...nodes].filter(
    (node): node is SchemaNode => node !== null
  )

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph
        })
      }}
    />
  )
}
