import { RichText } from "basehub/react-rich-text"
import Image from "next/image"

import { cn } from "@/utils/cn"

import { QueryType } from "./query"

export const Values = ({ data }: { data: QueryType }) => {
  return (
    <section className="mb-18 lg:mb-44">
      <div className="grid-layout">
        <p className="col-span-full w-full border-b border-brand-w1/20 pb-2 text-mobile-h3 text-brand-g1 lg:text-h3">
          Our Values
        </p>
      </div>

      <div className="flex w-full flex-col">
        {data.company.ourValues.valuesList.items.map(
          ({ _title, image, description }, idx) => (
            <div
              className={cn(
                "grid-layout relative mb-4 !gap-y-4 px-4 pt-4 lg:mb-2 lg:!gap-y-2 lg:pt-2",
                idx !== 0 &&
                  "after:absolute after:left-4 after:right-4 after:top-0 after:w-[calc(100%-32px)] after:border-t after:border-brand-w1/20",
                idx === data.company.ourValues.valuesList.items.length - 1 &&
                  "mb-0 before:absolute before:-bottom-2 before:left-4 before:w-[calc(100%-32px)] before:border-b before:border-brand-w1/20"
              )}
              key={idx}
            >
              <p className="col-span-full text-mobile-h2 text-brand-w2 lg:col-start-1 lg:col-end-5 lg:text-h2">
                {_title}
              </p>
              <div className="col-span-full grid grid-cols-3 lg:col-start-5 lg:col-end-8">
                <p className="col-span-1 hidden text-h1 text-brand-g1 lg:block">
                  {idx + 1}
                </p>

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

              <div className="col-span-full text-mobile-h4 text-brand-w2 lg:col-start-9 lg:col-end-13 lg:text-h4">
                <RichText content={description?.json?.content ?? []} />
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}
