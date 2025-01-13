import { RichText } from "basehub/react-rich-text"
import Image from "next/image"

import { cn } from "@/utils/cn"

import { QueryType } from "./careers-query"

export const Values = ({ data }: { data: QueryType }) => {
  return (
    <section className="mb-[168px] pb-2">
      <div className="grid-layout">
        <p className="col-span-full w-full border-b border-brand-w1/20 pb-2 text-paragraph text-brand-g1">
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
              <p className="col-start-1 col-end-5 text-subheading text-brand-w2">
                {_title}
              </p>
              <div className="col-start-5 col-end-8 flex grid grid-cols-2">
                <p className="text-heading text-brand-g1">{idx + 1}</p>
                {image && (
                  <Image
                    src={image.url}
                    alt={image.alt ?? ""}
                    width={image.width}
                    height={image.height}
                    className="aspect-[205/109] w-full object-cover"
                  />
                )}
              </div>
              <div className="col-start-9 col-end-13 max-w-[30.5625rem] text-paragraph text-brand-w2">
                <RichText content={description?.json?.content ?? []} />
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}
