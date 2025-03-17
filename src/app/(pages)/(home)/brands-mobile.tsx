import { Marquee } from "@/components/primitives/marquee"

import { fetchBrandsMobile } from "./basehub"
import { QueryType } from "./query"

export const BrandsMobile = async () => {
  const { rows } = await fetchBrandsMobile()

  return (
    <section className="grid-layout isolate !gap-y-0 lg:!hidden">
      <div className="grid-layout col-span-full !px-0">
        <h3 className="col-span-full mb-2 text-mobile-h3 text-brand-g1 lg:col-start-3 lg:col-end-7 lg:text-h3">
          Trusted by Visionaries
        </h3>

        <div className="col-span-full h-px w-full bg-brand-w1/30" />
      </div>

      <div className="relative col-span-full flex flex-col divide-y divide-brand-w1/30 border-b border-brand-w1/30">
        {rows.map((row, index) => (
          <MarqueeRow key={index} brands={row} index={index} />
        ))}
      </div>
    </section>
  )
}

interface MarqueeRowProps {
  brands: {
    _id: string
    _title: string
    logo: string | null
    website: string | null
  }[]
  index: number
}

const MarqueeRow = ({ brands, index }: MarqueeRowProps) => (
  <div className="relative py-2">
    <div className="absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-brand-k to-transparent" />
    <Marquee inverted={index % 2 === 0}>
      <div className="flex w-full items-center gap-x-2">
        {brands.map((brand) => (
          <div
            key={brand._id}
            className="[&>svg]:h-8 [&>svg]:w-auto"
            dangerouslySetInnerHTML={{ __html: brand.logo ?? "" }}
          />
        ))}
      </div>
    </Marquee>
  </div>
)
