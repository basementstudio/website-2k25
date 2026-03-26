"use client"

import Image from "next/image"

import { Video } from "@/components/primitives/video"
import { getImageUrl } from "@/service/sanity/helpers"
import { cn } from "@/utils/cn"

import { useProjectContext } from "./context"
import type { ShowcaseProjectDetail } from "./sanity"

export function ProjectGallery({
  entry,
}: {
  entry: ShowcaseProjectDetail
}) {
  const { viewMode } = useProjectContext()

  const showcase = entry.showcase?.filter((item) => Boolean(item))

  return (
    <div
      className={cn(
        "col-span-full grid gap-2 transition-all duration-300 lg:col-span-9 xl:col-span-10",
        viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
      )}
    >
      {showcase?.map(({ image, video }, idx) => {
        const img = getImageUrl(image)
        return (
          <div
            key={image?.asset?.url || video?.url || idx}
            className={cn(
              "relative aspect-video w-full overflow-hidden after:absolute after:inset-0 after:border after:border-brand-w1/20",
              // each 3 images put one full width
              viewMode === "grid" &&
                (idx + 1) % 3 === 0 &&
                "col-span-1 lg:col-span-2",

              // hide first item on mobile,
              idx === 0 && "hidden lg:block"
            )}
          >
            {/* if video, show video, image otherwise */}
            {video ? (
              <div className="with-dots h-full w-full after:absolute after:inset-0">
                <Video
                  src={video.url}
                  autoPlay
                  muted
                  loop
                  className="h-full w-full object-cover"
                />
              </div>
            ) : img ? (
              <div className="with-dots h-full w-full after:absolute after:inset-0">
                <Image
                  src={img.src}
                  width={img.width}
                  height={img.height}
                  alt={img.alt || ""}
                  blurDataURL={img.blurDataURL}
                  placeholder="blur"
                  className="object-cover"
                  priority={idx <= 3}
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
