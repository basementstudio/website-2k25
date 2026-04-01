interface SchemaImage {
  url: string
  width: number | null
  height: number | null
}

const normalizeImageUrl = (url: string) => {
  try {
    const normalized = new URL(url).toString()
    return normalized.includes("/_next/image") ? null : normalized
  } catch {
    return null
  }
}

export const createImageObject = (image?: SchemaImage | null) => {
  if (!image?.url) return null

  const url = normalizeImageUrl(image.url)
  if (!url) return null

  return {
    "@type": "ImageObject" as const,
    url,
    contentUrl: url,
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {})
  }
}
