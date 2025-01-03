import Image from "next/image"

import { cn } from "@/utils/cn"

import { Categories } from "./categories"
import { FilteredProjectType } from "./project-list"

const Placeholder = ({ className }: { className: string }) => (
  <svg
    stroke="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 418 296"
    className={className}
  >
    <path d="M0-.00024414  418 296" />
  </svg>
)

export const Grid = ({ projects }: { projects: FilteredProjectType[] }) => (
  <div className="grid-layout">
    {projects.map((item, index) => {
      const firstItem = index === 0

      return (
        <div
          key={item._title}
          className={cn(
            "relative",
            firstItem ? "col-span-6 row-span-2" : "col-span-3",
            "group aspect-[418/296] after:absolute after:inset-0 after:border after:border-brand-w1/20"
          )}
        >
          <div className="with-dots h-full w-full">
            {item.disabled && (
              <Placeholder className="absolute inset-0 text-brand-w1/20" />
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
                  firstItem && "h-[calc(50%-4px)]"
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
