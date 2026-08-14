import { SITE_URL } from "@/lib/constants"

export interface CollectionItem {
  name: string
  /** Site-relative path to the item, e.g. "/showcase/my-project". */
  path: string
}

interface CollectionPageInput {
  /** Listing page path, e.g. "/showcase" or "/blog". */
  path: string
  name: string
  description?: string | null
  items: CollectionItem[]
}

/**
 * Builds a schema.org `CollectionPage` whose `mainEntity` is an `ItemList` of
 * the listed posts/projects. Item URLs are joined to the canonical origin so
 * every entry is an absolute https://basement.studio URL, consistent with the
 * other schema builders.
 */
export const generateCollectionPageSchema = ({
  path,
  name,
  description,
  items
}: CollectionPageInput) => {
  const url = new URL(path, SITE_URL).toString()
  const listed = items.filter((item) => Boolean(item.name?.trim() && item.path))

  return {
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name,
    url,
    ...(description ? { description } : {}),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: listed.length,
      itemListElement: listed.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: new URL(item.path, SITE_URL).toString()
      }))
    }
  }
}
