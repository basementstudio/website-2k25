import { SITE_URL } from "@/lib/constants"

export interface BreadcrumbItem {
  /** Human-readable label, e.g. "Showcase" or the page title. */
  name: string
  /** Site-relative path, e.g. "/showcase" or "/showcase/my-project". */
  path: string
}

/**
 * Builds a schema.org `BreadcrumbList` for a nested route. Paths are joined to
 * the canonical origin so every `item` is an absolute https://basement.studio
 * URL, consistent with the other schema builders.
 */
export const generateBreadcrumbSchema = (items: BreadcrumbItem[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: new URL(item.path, SITE_URL).toString()
  }))
})
