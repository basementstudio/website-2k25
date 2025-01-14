import Image from "next/image"

import { Placeholder } from "@/components/primitives/placeholder"
import { cn } from "@/utils/cn"

import { Categories } from "./categories"
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
                  "absolute inset-0 flex flex-col justify-center opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-100",
                  firstItem && "h-[calc(50%-2px)]"
                )}
              >
                <div
                  className={cn(
                    "grid gap-2 border-y border-brand-w1/20 pb-1 pt-0.75",
                    firstItem ? "grid-cols-6" : "grid-cols-3"
                  )}
                >
                  <p
                    className={cn(
                      "pl-2 !text-paragraph text-brand-w1",
                      firstItem && "col-start-2"
                    )}
                  >
                    Client
                  </p>
                  <p className="pl-2 text-paragraph text-brand-w1">
                    {item.project?.client?._title}
                  </p>
                </div>

                <div
                  className={cn(
                    "grid gap-2 border-b border-brand-w1/20 pb-1 pt-0.75",
                    firstItem ? "grid-cols-6" : "grid-cols-3"
                  )}
                >
                  <p
                    className={cn(
                      "pl-2 !text-paragraph text-brand-w1",
                      firstItem && "col-start-2"
                    )}
                  >
                    Type
                  </p>

                  <Categories
                    categories={
                      item.project?.categories?.map((cat) => cat._title) ?? []
                    }
                    className="col-span-2 pl-2"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )
    })}
  </div>
)
