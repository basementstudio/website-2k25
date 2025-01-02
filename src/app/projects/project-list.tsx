import Image from "next/image"
import { useMemo } from "react"

import { Checkbox } from "@/components/primitives/checkbox"
import { cn } from "@/utils/cn"

import { QueryType } from "./query"

const GridIcon = () => (
  <svg
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    className="size-3"
  >
    <path d="M2 2h5v5H2zM7 7h3v3H7z" />
  </svg>
)

const RowIcon = () => (
  <svg
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    className="size-3"
  >
    <path d="M1 4h10v1H1zM1 7h10v1H1z" />
  </svg>
)

export const ProjectList = ({ data }: { data: QueryType }) => {
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        data.pages.projects.projectList.items.flatMap((item) =>
          item?.project?.categories?.map((cat) => cat._title)
        )
      )
    )
  }, [data.pages.projects.projectList.items])

  return (
    <section className="flex flex-col gap-3">
      <div className="grid-layout items-end">
        <div className="col-span-1 flex items-center gap-1 text-paragraph text-brand-g1">
          <div className="flex items-center justify-center gap-1 text-brand-w1">
            <GridIcon />
            <span className="actionable">Grid</span>
          </div>
          ,
          <div className="flex items-center justify-center gap-1 text-brand-w1">
            <RowIcon />
            <span className="actionable">Rows</span>
          </div>
        </div>
        <div className="col-span-2 col-start-6 flex flex-wrap gap-1">
          {categories.map((category) => (
            <Checkbox key={category}>{category}</Checkbox>
          ))}
        </div>
      </div>
      <div className="grid-layout">
        {data.pages.projects.projectList.items.map((item, index) => (
          <div
            key={item._title}
            className={`relative ${
              index === 0 ? "col-span-6 row-span-2" : "col-span-3"
            } group aspect-[418/296] after:absolute after:inset-0 after:border after:border-brand-w1/20`}
          >
            <div className="with-dots h-full w-full">
              <Image
                src={item.cover?.url ?? ""}
                alt={item.cover?.alt ?? ""}
                width={item.cover?.width ?? 0}
                height={item.cover?.height ?? 0}
                className="absolute inset-0 object-cover transition-opacity duration-300 group-hover:opacity-70"
              />
              <div
                className={cn(
                  "absolute inset-0 flex flex-col justify-center mix-blend-screen",
                  index === 0 && "h-[calc(50%-4px)]"
                )}
              >
                <div
                  className={cn(
                    "grid gap-2 border-y border-brand-w1/20 bg-red-500 py-1",
                    index === 0 ? "grid-cols-6" : "grid-cols-3"
                  )}
                >
                  <p
                    className={cn(
                      "pl-2 !text-paragraph text-brand-w1",
                      index === 0 ? "col-start-2" : ""
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
                    "grid gap-2 border-b border-brand-w1/20 bg-red-500 py-1",
                    index === 0 ? "grid-cols-6" : "grid-cols-3"
                  )}
                >
                  <p
                    className={cn(
                      "pl-2 !text-paragraph text-brand-w1",
                      index === 0 ? "col-start-2" : ""
                    )}
                  >
                    Type
                  </p>
                  <div className="pl-2">
                    <p className="h-4 w-fit bg-brand-g2 px-1 text-paragraph text-brand-w2">
                      {item.project?.categories?.[0]?._title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
