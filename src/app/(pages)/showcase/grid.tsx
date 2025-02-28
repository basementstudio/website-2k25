import Image from "next/image"

import { InfoItem } from "@/components/primitives/info-item"
import { Link } from "@/components/primitives/link"
import { Placeholder } from "@/components/primitives/placeholder"
import { TextList } from "@/components/primitives/text-list"
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
    <div className="grid-layout !gap-y-8 lg:!gap-y-2">
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
              item.disabled && "pointer-events-none"
            )}
          >
            <div className="group relative aspect-[418/296] cursor-pointer after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20 lg:h-full">
              <Link
                href={`/showcase/${item.project?._slug}`}
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
                  src={item.project?.cover?.url ?? ""}
                  alt={item.project?.cover?.alt ?? ""}
                  width={item.project?.cover?.width ?? 0}
                  height={item.project?.cover?.height ?? 0}
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300",
                    !item.disabled && "opacity-100 group-hover:opacity-70"
                  )}
                  priority
                />

                {!item.disabled && (
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 flex h-[calc(25%-6px)] flex-col justify-end text-p font-semibold opacity-0 transition-opacity duration-300 lg:group-hover:opacity-100",
                      firstItem && "h-[calc(12.5%-7px)]"
                    )}
                  >
                    <div className="grid grid-cols-6 gap-2 bg-brand-k">
                      <p className="col-span-2 px-2 text-p leading-none text-brand-w2">
                        {item.project?._title}
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

            <MobileInfo item={item} />
          </article>
        )
      })}

      {/* Add placeholder items to fill the grid */}
      {placeholders.map((_, index) => (
        <div
          key={`placeholder-${index}`}
          className="with-diagonal-lines hidden aspect-[418/296] lg:col-span-3 [&.with-diagonal-lines]:after:animate-none [&.with-diagonal-lines]:after:from-brand-w1/[0.20]"
        />
      ))}
    </div>
  )
}

const MobileInfo = ({ item }: { item: FilteredProjectType }) => {
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
}
