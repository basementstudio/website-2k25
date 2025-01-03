import Image from "next/image"
import { QueryType } from "./careers-query"
import { cn } from "@/utils/cn"

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
          ({ _title, image, text }, idx) => (
            <div
              className={cn(
                "grid-layout mb-2 pt-2",
                idx !== 0 && "border-t border-brand-w1/20",
                idx === data.company.ourValues.valuesList.items.length - 1 &&
                  "mb-0 border-b border-brand-w1/20 pb-2"
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
                {text}
              </p>
            </div>
          )
        )}
      </div>
    </section>
  )
}
