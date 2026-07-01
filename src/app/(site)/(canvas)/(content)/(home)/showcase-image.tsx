"use client"

import type { ImageFragment } from "@/components/primitives/image-with-video-overlay"
import { ImageWithVideoOverlay } from "@/components/primitives/image-with-video-overlay"
import { Link } from "@/components/primitives/link"
import { useMedia } from "@/hooks/use-media"
import { useCursor } from "@/hooks/use-mouse"
import { resolveVideoSource } from "@/lib/video/resolve-source"
import type { SanityImage } from "@/service/sanity/types"

import type { FeaturedProjectItem } from "./sanity"

/** Convert a SanityImage to the ImageFragment shape used by ImageWithVideoOverlay. */
function toImageFragment(img: SanityImage | null): ImageFragment | null {
  if (!img?.asset) return null
  return {
    url: img.asset.url,
    alt: img.alt ?? "",
    width: img.asset.metadata.dimensions.width,
    height: img.asset.metadata.dimensions.height,
    blurDataURL: img.asset.metadata.lqip
  }
}

interface ShowcaseImageProps {
  item: FeaturedProjectItem
}

export const ShowcaseImage = ({ item }: ShowcaseImageProps) => {
  const setCursor = useCursor()
  const isCursorHover = useMedia("(hover: hover)")

  const image = toImageFragment(item.cover)
  if (!image) return null

  const slug = item.project?.slug?.current
  const displayTitle = item.title ?? item.project?.title ?? "Untitled"

  if (!slug) {
    return (
      <div className="with-dots relative h-full w-full">
        <ImageWithVideoOverlay
          image={image}
          video={resolveVideoSource({
            mux: item.muxCoverVideo,
            legacy: item.coverVideo
          })}
          className="aspect-video"
        />
      </div>
    )
  }

  return (
    <Link
      href={`/showcase/${slug}`}
      onMouseEnter={() => {
        if (isCursorHover) setCursor("zoom-in", "View Project")
      }}
      onMouseLeave={() => setCursor("default", null)}
      className="block focus-visible:!ring-offset-0"
      aria-label={`View ${displayTitle}`}
    >
      <div className="with-dots relative h-full w-full">
        <ImageWithVideoOverlay
          image={image}
          video={resolveVideoSource({
            mux: item.muxCoverVideo,
            legacy: item.coverVideo
          })}
          className="aspect-video"
        />
      </div>
    </Link>
  )
}
