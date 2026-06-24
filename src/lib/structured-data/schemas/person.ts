import { ORGANIZATION_ID } from "./organization"

const SITE_URL = "https://basement.studio"

interface PersonImage {
  url: string
  width?: number | null
  height?: number | null
}

interface PersonSocial {
  platform: string
  url: string
}

export interface PersonSchemaData {
  name: string
  jobTitle?: string | null
  image?: PersonImage | null
  socialNetworks?: PersonSocial[] | null
}

const buildPersonNode = (person: PersonSchemaData) => {
  const sameAs = (person.socialNetworks ?? [])
    .map((s) => s.url)
    .filter((url): url is string => Boolean(url))

  const image = person.image?.url
    ? {
        "@type": "ImageObject" as const,
        url: person.image.url,
        ...(person.image.width ? { width: person.image.width } : {}),
        ...(person.image.height ? { height: person.image.height } : {})
      }
    : null

  return {
    "@type": "Person" as const,
    name: person.name,
    ...(person.jobTitle ? { jobTitle: person.jobTitle } : {}),
    ...(image ? { image } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    worksFor: { "@id": ORGANIZATION_ID }
  }
}

/**
 * Builds an `ItemList` of `Person` nodes for the team / people page. Each
 * `Person` is linked to the existing Organization node via `worksFor` →
 * `@id`. Only fields present in the CMS data are emitted; missing fields
 * (e.g. job title, image, social links) are omitted rather than invented.
 */
export const generatePeopleSchema = (people: PersonSchemaData[]) => {
  const members = people.filter((p) => Boolean(p.name?.trim()))

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/people#team`,
    name: "basement.studio team",
    url: `${SITE_URL}/people`,
    numberOfItems: members.length,
    itemListElement: members.map((person, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: buildPersonNode(person)
    }))
  }
}
