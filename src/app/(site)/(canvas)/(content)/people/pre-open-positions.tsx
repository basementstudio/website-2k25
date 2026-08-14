import { PortableText } from "@portabletext/react"
import Image from "next/image"

import { getImageUrl } from "@/service/sanity/helpers"

import type { PeoplePageData } from "./sanity"

export const PreOpenPositions = ({ data }: { data: PeoplePageData }) => {
  const sideA = getImageUrl(data.preOpenPositionsSideImages?.[0])
  const sideB = getImageUrl(data.preOpenPositionsSideImages?.[1])

  return (
    <section className="grid-layout mb-18 lg:mb-48">
      <div className="col-span-full mb-4 text-pretty text-f-h4-mobile text-brand-w1 lg:col-start-9 lg:col-end-12 lg:mb-0 lg:text-f-h4">
        <PortableText value={data.preOpenPositionsText ?? []} />
      </div>
      {sideA && (
        <div className="with-dots col-span-2 h-full w-full object-cover lg:col-start-1 lg:col-end-5 lg:row-start-1 lg:h-fit">
          <div className="relative h-full after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
            <Image
              src={sideA.src}
              alt={sideA.alt ?? ""}
              width={sideA.width}
              height={sideA.height}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {sideB && (
        <div className="with-dots col-span-2 lg:col-start-5 lg:col-end-9 lg:row-start-1">
          <div className="relative after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
            <Image
              src={sideB.src}
              alt={sideB.alt ?? ""}
              width={sideB.width}
              height={sideB.height}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}
    </section>
  )
}
