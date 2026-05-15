import type { SanityImage } from "./types"

/**
 * Build a transformed Sanity CDN URL from an asset URL.
 *
 * `auto=format` and `fit=max` are always applied so Sanity returns AVIF/WebP
 * (when the client supports it) and never upscales beyond the original asset.
 */
export function buildSanityImageUrl(
  assetUrl: string,
  opts?: { width?: number; quality?: number }
): string {
  const params = new URLSearchParams({ auto: "format", fit: "max" })
  if (opts?.width) params.set("w", String(opts.width))
  if (opts?.quality) params.set("q", String(opts.quality))
  return `${assetUrl}?${params.toString()}`
}

/**
 * Converts a SanityImage (projected via `imageFragment`) into the flat shape
 * expected by Next.js `<Image>` and the codebase's existing image components.
 *
 * Returns `null` when the image asset is missing (e.g. unpublished reference).
 * Prefer the `<SanityImage>` wrapper for rendering; this helper is for cases
 * that need to read width/height/blur outside the render tree.
 */
export function getImageUrl(
  image: SanityImage | null | undefined,
  opts?: { width?: number; quality?: number }
): {
  src: string
  width: number
  height: number
  blurDataURL: string
  alt: string
} | null {
  if (!image?.asset) return null

  const { asset, alt } = image
  return {
    src: buildSanityImageUrl(asset.url, opts),
    width: asset.metadata.dimensions.width,
    height: asset.metadata.dimensions.height,
    blurDataURL: asset.metadata.lqip,
    alt: alt ?? ""
  }
}
