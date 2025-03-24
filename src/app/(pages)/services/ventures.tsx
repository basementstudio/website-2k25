import { RichText } from "@/components/primitives/rich-text"

import { QueryType } from "./query"
import Image from "next/image"

export const VenturesBanner = ({ data }: { data: QueryType }) => (
  <div className="grid-layout -mb-6">
    <h2 className="col-span-full text-f-h3-mobile text-brand-g1 lg:col-start-3 lg:col-end-6 lg:text-f-h3">
      {data.pages.services.ventures.title}
    </h2>

    <div className="first:[&_p]:text-brt-0.75 col-span-full -mt-0.75 [&_p]:!text-f-h1-mobile lg:[&_p]:!text-f-h1">
      <RichText components={{ a: CtaTargetBlank }}>
        {data.pages.services.ventures.content?.json.content}
      </RichText>
    </div>

    {data.pages.services.ventures.image && (
      <div className="with-dots col-span-full mt-8 lg:col-start-1 lg:col-end-12 lg:mt-18">
        <div className="relative after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
          <Image
            width={data.pages.services.ventures.image.width}
            height={data.pages.services.ventures.image.height}
            src={data.pages.services.ventures.image.url}
            alt=""
          />
        </div>
      </div>
    )}
  </div>
)

const CtaTargetBlank = (props: any) => (
  <a
    {...props}
    target="_blank"
    className="actionable"
    rel="noopener noreferrer"
  />
)
