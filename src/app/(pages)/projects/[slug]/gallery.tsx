"use client"

import Image from "next/image"

import { cn } from "@/utils/cn"

import { useProjectContext } from "./context"
import { QueryItemType } from "./query"

export function ProjectGallery({ entry }: { entry: QueryItemType }) {
  const { viewMode } = useProjectContext()

  const showcase = entry.showcase.items
    .map((item) => item.image)
    .filter((image) => image !== null)

  return (
    <div
      className={cn(
        "col-span-10 grid gap-2 transition-all duration-300",
        viewMode === "grid" ? "grid-cols-2" : "grid-cols-1"
      )}
    >
      {showcase.map((image, idx) => (
        <div
          key={image.url}
          className={cn(
            "relative aspect-video w-full overflow-hidden",
            // each 3 images put one full width
            viewMode === "grid" && (idx + 1) % 3 === 0 && "col-span-2"
          )}
        >
          <Image
            src={image.url}
            alt={image.alt || ""}
            fill
            className="object-cover"
          />
        </div>
      ))}
    </div>
  )
}
