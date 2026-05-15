import Image, { type ImageProps } from "next/image"

import { buildSanityImageUrl } from "@/service/sanity/helpers"
import type { SanityImage as SanityImageData } from "@/service/sanity/types"

type Props = Omit<ImageProps, "src" | "alt"> & {
  image: SanityImageData | null | undefined
  alt?: string
  /**
   * Width of the variant to request from Sanity's CDN. Defaults to `2 × width`
   * for retina headroom. Pass explicitly when using `fill` mode.
   */
  sourceWidth?: number
}

export function SanityImage(props: Props) {
  const { image, alt, sourceWidth, blurDataURL, placeholder, ...rest } = props
  if (!image?.asset) return null
  const { asset } = image

  const sw =
    sourceWidth ??
    (typeof rest.width === "number" ? rest.width * 2 : undefined)
  const src = buildSanityImageUrl(asset.url, { width: sw })

  const isFill = "fill" in rest && rest.fill === true
  const dimensions = isFill
    ? {}
    : {
        width: rest.width ?? asset.metadata.dimensions.width,
        height: rest.height ?? asset.metadata.dimensions.height
      }

  return (
    <Image
      {...(rest as ImageProps)}
      {...dimensions}
      src={src}
      alt={alt ?? image.alt ?? ""}
      placeholder={placeholder ?? (asset.metadata.lqip ? "blur" : "empty")}
      blurDataURL={blurDataURL ?? asset.metadata.lqip}
    />
  )
}
