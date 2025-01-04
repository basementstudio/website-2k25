import Image from "next/image"

import { cn } from "@/utils/cn"

import { QueryType } from "./careers-query"

export const Values = ({ data }: { data: QueryType }) => {
  return (
    <section>
      <div className="px-4">
        <p className="w-full border-b border-brand-w1/20 pb-2 text-paragraph text-brand-g1">
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
                  "mb-0 before:absolute before:-bottom-2 before:left-0 before:w-full before:border-b before:border-brand-w1/20"
              )}
              key={idx}
            >
              <p className="col-start-1 col-end-5 text-subheading text-brand-w2">
                {_title}
              </p>
              <div className="col-start-5 col-end-8 flex w-full items-start justify-between">
                <p className="text-heading text-brand-g1">{idx + 1}</p>
                {image && (
                  <Image
                    src={image.url}
                    alt={image.alt ?? ""}
                    width={image.width}
                    height={image.height}
                    className="h-[109px] w-[205px] object-cover"
                  />
                )}
              </div>
              <p className="col-start-9 col-end-13 max-w-[489px] text-paragraph text-brand-w2">
                {description}
              </p>
            </div>
          )
        )}
      </div>
    </section>
  )
}
