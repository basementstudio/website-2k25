import type { SanityImage } from "./types"

/**
 * Largest source dimension we ever ask Sanity for. The CDN stores originals up
 * to 5760px, and next/image would otherwise fetch (and re-encode) the full file
 * even when it renders a fraction of that. Capping the source at 2400px keeps
 * images retina-sharp while cutting the bytes Next pulls upstream.
 */
const MAX_SOURCE_DIMENSION = 2400

/**
 * Converts a SanityImage (projected via `imageFragment`) into the flat shape
 * expected by Next.js `<Image>` and the codebase's existing image components.
 *
 * The source URL is capped at {@link MAX_SOURCE_DIMENSION} and asked to
 * auto-negotiate a modern format, and the reported dimensions are scaled to
 * match so next/image never believes the asset is larger than what it serves.
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

/**
 * Appends Sanity CDN transform params to cap the served source. Only touches
 * cdn.sanity.io URLs and only downscales (never upscales). Other hosts (e.g.
 * Twitter avatars) are returned untouched.
 */
function capSanitySource(url: string, scale: number): string {
  if (scale >= 1 || !url.includes("cdn.sanity.io")) return url

  // fit=max bounds the image within the w×h box (no crop, no upscale), so the
  // longest side — width or height — is capped at MAX_SOURCE_DIMENSION.
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}w=${MAX_SOURCE_DIMENSION}&h=${MAX_SOURCE_DIMENSION}&fit=max&auto=format`
}
