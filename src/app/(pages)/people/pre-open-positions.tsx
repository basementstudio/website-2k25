import { RichText } from "basehub/react-rich-text"
import Image from "next/image"

import { QueryType } from "./query"

export const PreOpenPositions = ({ data }: { data: QueryType }) => (
  <section className="grid-layout mb-18 lg:mb-48">
    <div className="col-span-full mb-4 text-pretty text-f-h4-mobile text-brand-w1 lg:col-start-9 lg:col-end-12 lg:mb-0 lg:text-f-h4">
      <RichText
        content={data.pages.people.preOpenPositions.text.json.content}
      />
    </div>
    <div className="with-dots col-span-2 h-full w-full object-cover lg:col-start-1 lg:col-end-5 lg:row-start-1 lg:h-fit">
      <div className="relative h-full after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
        <Image
          src={data.pages.people.preOpenPositions.sideA.url}
          alt=""
          width={data.pages.people.preOpenPositions.sideA.width}
          height={data.pages.people.preOpenPositions.sideA.height}
          className="h-full w-full object-cover"
        />
      </div>
    </div>

    <div className="with-dots col-span-2 lg:col-start-5 lg:col-end-9 lg:row-start-1">
      <div className="relative after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
        <Image
          src={data.pages.people.preOpenPositions.sideB.url}
          alt=""
          width={data.pages.people.preOpenPositions.sideB.width}
          height={data.pages.people.preOpenPositions.sideB.height}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  </section>
)
