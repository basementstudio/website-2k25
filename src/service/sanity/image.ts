import imageUrlBuilder, { type SanityImageSource } from "@sanity/image-url"

import { dataset, projectId } from "../../../sanity/env"

const builder = imageUrlBuilder({ projectId, dataset })

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
