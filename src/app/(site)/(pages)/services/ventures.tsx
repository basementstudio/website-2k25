import Image from "next/image"

import { PortableText } from "@/components/primitives/portable-text"
import { getImageUrl } from "@/service/sanity/helpers"

import type { ServicesPageData } from "./sanity"

export const VenturesBanner = ({ data }: { data: ServicesPageData }) => {
  const venture = data.ventures[0]
  if (!venture) return null

  const img = getImageUrl(venture.image)

  return (
    <div className="grid-layout -mb-6">
      <h2 className="col-span-full text-f-h3-mobile text-brand-g1 lg:col-start-3 lg:col-end-6 lg:text-f-h3">
        {venture.title}
      </h2>

      <div className="first:[&_p]:text-brt-0.75 col-span-full -mt-0.75 [&_p]:!text-f-h1-mobile lg:[&_p]:!text-f-h1">
        {venture.content && (
          <PortableText
            value={venture.content}
            components={{
              marks: {
                link: ({ children, value }) => (
                  <a
                    href={value?.href}
                    target="_blank"
                    className="actionable"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                )
              }
            }}
          />
        )}
      </div>

      {img && (
        <div className="with-dots col-span-full mt-8 lg:col-start-1 lg:col-end-12 lg:mt-18">
          <div className="relative after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
            <Image width={img.width} height={img.height} src={img.src} alt="" />
          </div>
        </div>
      )}
    </div>
  )
}
