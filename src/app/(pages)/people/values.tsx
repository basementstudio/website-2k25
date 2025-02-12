import { RichText } from "basehub/react-rich-text"
import Image from "next/image"

import { cn } from "@/utils/cn"

import { QueryType } from "./query"

export const Values = ({ data }: { data: QueryType }) => {
  return (
    <section className="mb-44">
      <div className="grid-layout">
        <p className="col-span-full w-full border-b border-brand-w1/20 pb-2 text-h3 text-brand-g1">
          Our Values
        </p>
      </div>

      <div className="flex w-full flex-col">
        {data.company.ourValues.valuesList.items.map(
          ({ _title, image, description }, idx) => (
            <div
              className={cn(
                "grid-layout relative mb-2 px-4 pt-2",
                idx !== 0 &&
                  "after:absolute after:left-4 after:right-4 after:top-0 after:w-[calc(100%-32px)] after:border-t after:border-brand-w1/20",
                idx === data.company.ourValues.valuesList.items.length - 1 &&
                  "mb-0 before:absolute before:-bottom-2 before:left-4 before:w-[calc(100%-32px)] before:border-b before:border-brand-w1/20"
              )}
              key={idx}
            >
              <p className="col-start-1 col-end-5 text-h2 text-brand-w2">
                {_title}
              </p>
              <div className="col-start-5 col-end-8 grid grid-cols-3">
                <p className="col-span-1 text-h1 text-brand-g1">{idx + 1}</p>

                {image && (
                  <div className="relative col-span-2 aspect-[205/109] w-full after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
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

              <div className="col-start-9 col-end-13 text-h4 text-brand-w2">
                <RichText content={description?.json?.content ?? []} />
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}
