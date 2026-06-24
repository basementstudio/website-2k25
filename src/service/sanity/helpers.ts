import type { SanityImage } from "./types"

// Originals run up to 5760px; cap the source so next/image doesn't fetch and
// re-encode the full file for media rendered far smaller.
const MAX_SOURCE_DIMENSION = 2400

/**
 * Converts a SanityImage (projected via `imageFragment`) into the flat shape
 * expected by Next.js `<Image>` and the codebase's existing image components.
 *
 * Returns `null` when the image asset is missing (e.g. unpublished reference).
 */
export function getImageUrl(image: SanityImage | null | undefined): {
  src: string
  width: number
  height: number
  blurDataURL: string
  alt: string
} | null {
  if (!image?.asset) return null

  const { asset, alt } = image
  const { width, height } = asset.metadata.dimensions

  const longestSide = Math.max(width, height)
  const scale =
    longestSide > MAX_SOURCE_DIMENSION ? MAX_SOURCE_DIMENSION / longestSide : 1

  return {
    src: capSanitySource(asset.url, scale),
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    blurDataURL: asset.metadata.lqip,
    alt: alt ?? ""
  }
}

function capSanitySource(url: string, scale: number): string {
  if (scale >= 1 || !url.includes("cdn.sanity.io")) return url

  // fit=max bounds the longest side to the box without cropping or upscaling.
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}w=${MAX_SOURCE_DIMENSION}&h=${MAX_SOURCE_DIMENSION}&fit=max&auto=format`
}
