"use client"

import Image from "next/image"

import { cn } from "@/utils/cn"

import { useProjectContext } from "./context"
import { QueryItemType } from "./query"

export function ProjectGallery({ entry }: { entry: QueryItemType }) {
  const { viewMode } = useProjectContext()

  const showcase = entry.project?.showcase?.items.filter((item) =>
    Boolean(item)
  )

  return (
    <div
      className={cn(
        "col-span-full grid gap-2 transition-all duration-300 lg:col-span-10",
        viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
      )}
    >
      {showcase?.map(({ image, video }, idx) => (
        <div
          key={image?.url || video?.url}
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
              <video
                src={video.url}
                autoPlay
                playsInline
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
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
