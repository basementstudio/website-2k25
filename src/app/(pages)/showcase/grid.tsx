import Image from "next/image"
import { memo, useMemo } from "react"

import { ImageWithVideoOverlay } from "@/components/primitives/image-with-video-overlay"
import { InfoItem } from "@/components/primitives/info-item"
import { Link } from "@/components/primitives/link"
import { Placeholder } from "@/components/primitives/placeholder"
import { TextList } from "@/components/primitives/text-list"
import { cn } from "@/utils/cn"

import { FilteredProjectType } from "./project-list"

const GRID_COLS = 6
const REGULAR_ITEM_COLS = 3

const calculatePlaceholders = (projectsLength: number) => {
  if (projectsLength === 0) return []

  const remainingItems = projectsLength - 1
  const itemsPerRow = GRID_COLS / REGULAR_ITEM_COLS

  // calculate total rows needed (first row has only first item)
  const regularRows = Math.ceil(remainingItems / itemsPerRow)
  const totalCells = regularRows * itemsPerRow

  // calculate how many placeholders we need
  const placeholdersNeeded = totalCells - remainingItems

  return Array(placeholdersNeeded).fill(null)
}

const MobileInfo = memo(({ item }: { item: FilteredProjectType }) => {
  return (
    <div className="col-span-full flex flex-col divide-y divide-brand-w1/20 lg:hidden">
      <InfoItem label="Client" value={item.project?.client?._title} />
      <InfoItem
        label="Type"
        value={
          <TextList
            value={
              item.project?.categories?.map((cat) => (
                <span key={cat._title}>{cat._title}</span>
              )) || []
            }
            className="text-p"
          />
        }
      />
      <div />
    </div>
  )
})
MobileInfo.displayName = "MobileInfo"

export const Grid = memo(
  ({ projects }: { projects: FilteredProjectType[] }) => {
    const placeholders = useMemo(
      () => calculatePlaceholders(projects.length),
      [projects.length]
    )

    return (
      <div className="grid-layout contain-layout !gap-y-8 lg:!gap-y-2">
        {projects.map((item, index) => {
          const firstItem = index === 0

          return (
            <article
              key={item._title + index}
              className={cn(
                "relative flex flex-col gap-y-2 lg:gap-y-0",
                firstItem
                  ? "col-span-full lg:col-span-6 lg:row-span-2 lg:h-full"
                  : "col-span-full lg:col-span-3",
                item.disabled && "pointer-events-none",
                "contain-paint"
              )}
            >
              <div
                className={cn(
                  "group relative aspect-[418/296] cursor-pointer after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20 lg:h-full",
                  "will-change-[opacity,transform] hover:will-change-auto"
                )}
              >
                <Link
                  href={`/showcase/${item.project?._slug}`}
                  className={cn("with-dots block h-full w-full", {
                    "pointer-events-none": item.disabled
                  })}
                >
                  {item.disabled || !item.project?.cover ? (
                    <Placeholder
                      className="absolute inset-0 text-brand-w1/20"
                      width={firstItem ? 836 : 418}
                      height={firstItem ? 592 : 296}
                    />
                  ) : null}

                  {item.project?.cover ? (
                    <ImageWithVideoOverlay
                      image={item.project?.cover}
                      video={item.project?.coverVideo}
                      disabled={item.disabled}
                    />
                  ) : null}
                </Link>
              </div>

              <MobileInfo item={item} />
            </article>
          )
        })}

        {placeholders.map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="with-diagonal-lines contain-paint hidden aspect-[418/296] lg:col-span-3 [&.with-diagonal-lines]:after:animate-none [&.with-diagonal-lines]:after:from-brand-w1/[0.20]"
          />
        ))}
      </div>
    )
  }
)
Grid.displayName = "Grid"
