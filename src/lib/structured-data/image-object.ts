import type { SanityImage } from "@/service/sanity/types"

const SCHEMA_IMAGE_TARGET_WIDTH = 1200
const SANITY_CDN_HOST = "cdn.sanity.io"

const normalizeImageUrl = (url: string) => {
  try {
    const normalized = new URL(url)
    return normalized.toString().includes("/_next/image") ? null : normalized
  } catch {
    return null
  }
}

const getSchemaImageDimensions = (width: number, height: number) => {
  const targetWidth =
    width < SCHEMA_IMAGE_TARGET_WIDTH ? width : SCHEMA_IMAGE_TARGET_WIDTH

  return {
    width: targetWidth,
    height: Math.round((height * targetWidth) / width)
  }
}

/**
 * Converts a Sanity image reference into a schema.org `ImageObject`. Uses the
 * Sanity CDN's `w=` query parameter to ensure a reasonable image size for
 * indexing without blowing out responses.
 */
export const createImageObject = (image?: SanityImage | null) => {
  if (!image?.asset?.url) return null

  const url = normalizeImageUrl(image.asset.url)
  if (!url) return null

  const { width, height } = image.asset.metadata?.dimensions ?? {
    width: 0,
    height: 0
  }

  const dimensions =
    width && height ? getSchemaImageDimensions(width, height) : null

  if (dimensions && url.hostname === SANITY_CDN_HOST) {
    url.searchParams.set("w", String(dimensions.width))
    url.searchParams.set("auto", "format")
  }

  return {
    "@type": "ImageObject" as const,
    url: url.toString(),
    contentUrl: url.toString(),
    ...(dimensions ?? {})
  }
}
