import { RichText } from "basehub/react-rich-text"
import Image from "next/image"

import { cn } from "@/utils/cn"

import { QueryType } from "./query"

export const Values = ({ data }: { data: QueryType }) => {
  return (
    <section className="mb-18 lg:mb-44">
      <div className="grid-layout !gap-y-0">
        {data.company.ourValues.valuesList.items.map(
          ({ _title, image, description }, idx) => (
            <div
              key={_title}
              className={cn(
                "sticky top-[calc(4rem+46px)] col-span-full flex items-center justify-center",
                idx === 0 && "top-0"
              )}
            >
              <div
                className={cn(
                  "bg-brank-k relative col-span-full h-full",
                  idx === 0 && "pt-16"
                )}
                style={{ zIndex: idx + 1 }}
              >
                {idx === 0 && (
                  <h2
                    className={cn(
                      "col-span-full bg-brand-k pb-6 !text-mobile-h3 text-brand-g1 lg:!text-h3",
                      "border-b border-brand-w1/20"
                    )}
                  >
                    Our Values
                  </h2>
                )}
                <div
                  className={cn(
                    "grid-layout bg-transparent !px-0 py-4",
                    "bg-brand-k",
                    "border-t border-brand-w1/30",
                    "col-span-full"
                  )}
                >
                  <p className="col-span-full text-f-h1-mobile text-brand-w2 lg:col-start-1 lg:col-end-5 lg:text-f-h1">
                    {_title}
                  </p>
                  <div className="col-span-full lg:col-start-5 lg:col-end-8">
                    {image && (
                      <div className="relative col-span-full aspect-[205/109] w-full after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20 lg:col-span-2">
                        <div className="with-dots">
                          <Image
                            src={image.url}
                            alt={image.alt ?? ""}
                            width={image.width}
                            height={image.height}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-full !text-pretty text-mobile-h4 text-brand-w2 lg:col-start-8 lg:col-end-12 lg:text-h4">
                    <RichText content={description?.json?.content ?? []} />
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}
