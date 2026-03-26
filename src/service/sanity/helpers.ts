import type { SanityImage } from "./types"

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
  return {
    src: asset.url,
    width: asset.metadata.dimensions.width,
    height: asset.metadata.dimensions.height,
    blurDataURL: asset.metadata.lqip,
    alt: alt ?? "",
  }
}
