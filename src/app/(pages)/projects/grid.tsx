import Image from "next/image"

import { Placeholder } from "@/components/primitives/placeholder"
import { cn } from "@/utils/cn"

import { FilteredProjectType } from "./project-list"

export const Grid = ({ projects }: { projects: FilteredProjectType[] }) => (
  <div className="grid-layout">
    {projects.map((item, index) => {
      const firstItem = index === 0

      return (
        <div
          key={item._title + index}
          className={cn(
            "relative",
            firstItem ? "col-span-6 row-span-2" : "col-span-3",
            "group aspect-[418/296] cursor-pointer after:absolute after:inset-0 after:border after:border-brand-w1/20",
            item.disabled && "pointer-events-none"
          )}
        >
          <div className="with-dots h-full w-full">
            {item.disabled && (
              <Placeholder
                className="absolute inset-0 text-brand-w1/20"
                width={418}
                height={296}
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
                  "absolute inset-0 flex flex-col justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  firstItem && "h-[calc(50%-2px)]"
                )}
              >
                <div className={cn("grid grid-cols-12 bg-brand-k px-2")}>
                  <p className="col-span-4 text-p text-brand-w1">
                    {item.project?.client?._title}
                  </p>

                  <p className="col-span-8 inline-flex flex-wrap text-pretty text-p text-brand-w1">
                    {item.project?.categories?.map((cat, idx) => {
                      return (
                        <span key={cat._title}>
                          {cat._title}
                          {idx !==
                            (item.project?.categories?.length ?? 0) - 1 && (
                            <span className="inline-block px-1 text-brand-g1">
                              ,
                            </span>
                          )}
                        </span>
                      )
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    })}
  </div>
)
