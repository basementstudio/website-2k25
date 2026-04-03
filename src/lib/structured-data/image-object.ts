interface SchemaImage {
  url: string
  schemaUrl?: string | null
  width: number | null
  height: number | null
}

const SCHEMA_IMAGE_TARGET_WIDTH = 1200
const BASEHUB_IMAGE_HOSTS = new Set(["assets.basehub.com", "basehub.earth"])

const normalizeImageUrl = (url: string) => {
  try {
    const normalized = new URL(url)
    return normalized.toString().includes("/_next/image") ? null : normalized
  } catch {
    return null
  }
}

const getSchemaImageDimensions = (image: SchemaImage) => {
  if (!image.width) return {}

  const width =
    image.width < SCHEMA_IMAGE_TARGET_WIDTH
      ? image.width
      : SCHEMA_IMAGE_TARGET_WIDTH

  if (!image.height) return { width }

  return {
    width,
    height: Math.round((image.height * width) / image.width)
  }
}

export const createImageObject = (image?: SchemaImage | null) => {
  if (!image?.url) return null

  const shouldUseSchemaUrl = Boolean(
    image.schemaUrl &&
      (image.width === null || image.width >= SCHEMA_IMAGE_TARGET_WIDTH)
  )
  const url = normalizeImageUrl(
    shouldUseSchemaUrl ? image.schemaUrl! : image.url
  )
  if (!url) return null

  const dimensions = getSchemaImageDimensions(image)

  if (!shouldUseSchemaUrl && BASEHUB_IMAGE_HOSTS.has(url.hostname) && dimensions.width) {
    url.searchParams.set("width", String(dimensions.width))
  }

  return {
    "@type": "ImageObject" as const,
    url: url.toString(),
    contentUrl: url.toString(),
    ...dimensions
  }
}
