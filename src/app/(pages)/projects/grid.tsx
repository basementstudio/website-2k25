import Image from "next/image"
import Link from "next/link"

import { Placeholder } from "@/components/primitives/placeholder"
import { cn } from "@/utils/cn"

import { FilteredProjectType } from "./project-list"

const GRID_COLS = 6
const REGULAR_ITEM_COLS = 3

export const Grid = ({ projects }: { projects: FilteredProjectType[] }) => {
  const calculatePlaceholders = () => {
    if (projects.length === 0) return []

    const remainingItems = projects.length - 1
    const itemsPerRow = GRID_COLS / REGULAR_ITEM_COLS

    // calculate total rows needed (first row has only first item)
    const regularRows = Math.ceil(remainingItems / itemsPerRow)
    const totalCells = regularRows * itemsPerRow

    // calculate how many placeholders we need
    const placeholdersNeeded = totalCells - remainingItems

    return Array(placeholdersNeeded).fill(null)
  }

  const placeholders = calculatePlaceholders()

  return (
    <div className="grid-layout">
      {projects.map((item, index) => {
        const firstItem = index === 0

        return (
          <div
            key={item._title + index}
            className={cn(
              "relative",
              firstItem ? "col-span-6 row-span-2" : "col-span-3",
              "group aspect-[418/296] cursor-pointer after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20",
              item.disabled && "pointer-events-none"
            )}
          >
            <Link
              href={`/projects/${item.project?._slug}`}
              className={cn("with-dots block h-full w-full", {
                "pointer-events-none": item.disabled
              })}
            >
              {item.disabled && (
                <Placeholder
                  className="absolute inset-0 text-brand-w1/20"
                  width={firstItem ? 836 : 418}
                  height={firstItem ? 592 : 296}
                />
              )}
              <Image
                src={item.cover?.url ?? ""}
                alt={item.cover?.alt ?? ""}
                width={item.cover?.width ?? 0}
                height={item.cover?.height ?? 0}
                className={cn(
                  "absolute inset-0 object-cover opacity-0 transition-opacity duration-300",
                  !item.disabled && "opacity-100 group-hover:opacity-70"
                )}
              />

              {!item.disabled && (
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 flex h-[calc(25%-6px)] flex-col justify-end text-p font-semibold opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                    firstItem && "h-[calc(12.5%-7px)]"
                  )}
                >
                  <div className="grid grid-cols-6 gap-2 bg-brand-k">
                    <p className="col-span-2 px-2 text-p leading-none text-brand-w2">
                      {item.project?.client?._title}
                    </p>

                    <p className="col-span-4 inline-flex flex-wrap text-pretty px-2 text-p leading-none text-brand-w2">
                      {item.project?.categories?.map((cat, idx) => (
                        <span key={cat._title}>
                          {cat._title}
                          {idx !==
                            (item.project?.categories?.length ?? 0) - 1 && (
                            <span className="inline-block px-1 text-brand-g1">
                              ,
                            </span>
                          )}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              )}
            </Link>
          </div>
        )
      })}

      {/* Add placeholder items to fill the grid */}
      {placeholders.map((_, index) => (
        <div
          key={`placeholder-${index}`}
          className="with-diagonal-lines col-span-3 aspect-[418/296] [&.with-diagonal-lines]:after:animate-none [&.with-diagonal-lines]:after:from-brand-w1/[0.20]"
        />
      ))}
    </div>
  )
}
