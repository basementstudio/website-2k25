"use client"

import Image from "next/image"

import { Video } from "@/components/primitives/video"
import { cn } from "@/utils/cn"

import { useProjectContext } from "./context"
import { QueryItemType } from "./query"

export function ProjectGallery({ entry }: { entry: QueryItemType }) {
  const { viewMode } = useProjectContext()

  const showcase = entry.project?.showcase?.items.filter((item) =>
    Boolean(item)
  )

  return (
    <div className="col-span-full lg:col-span-9 xl:col-span-10">
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {showcase?.map(({ image, video }, idx) => (
            <div
              key={image?.url || video?.url}
              className={cn(
                "relative aspect-video w-full overflow-hidden after:absolute after:inset-0 after:border after:border-brand-w1/20",
                // each 3 images put one full width
                (idx + 1) % 3 === 0 && "col-span-1 lg:col-span-2",
                // hide first item on mobile and show it on desktop
                idx === 0 && "hidden lg:block"
              )}
            >
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
              ) : (
                <div className="with-dots h-full w-full after:absolute after:inset-0">
                  <Image
                    src={image?.url || ""}
                    width={image?.width}
                    height={image?.height}
                    alt={image?.alt || ""}
                    blurDataURL={image?.blurDataURL}
                    placeholder="blur"
                    className="object-cover"
                    priority={idx <= 3}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {showcase?.map(({ image, video }, idx) => (
            <div
              key={image?.url || video?.url}
              className="relative aspect-video w-full overflow-hidden after:absolute after:inset-0 after:border after:border-brand-w1/20"
            >
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
              ) : (
                <div className="with-dots h-full w-full after:absolute after:inset-0">
                  <Image
                    src={image?.url || ""}
                    width={image?.width}
                    height={image?.height}
                    alt={image?.alt || ""}
                    blurDataURL={image?.blurDataURL}
                    placeholder="blur"
                    className="object-cover"
                    priority={idx <= 3}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
