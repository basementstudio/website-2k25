"use client"
import { useLenis } from "lenis/react"
import { useMemo, useRef } from "react"

import { Marquee } from "@/components/primitives/marquee"
import { useMedia } from "@/hooks/use-media"

import { QueryType } from "./query"

// Function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export const BrandsMobile = ({ data }: { data: QueryType }) => {
  const brands = useMemo(
    () => data.company.clients?.clientList.items.filter((c) => c.logo) ?? [],
    [data.company.clients?.clientList.items]
  )

  const rows = useMemo(() => {
    // Shuffle the brands first
    const shuffledBrands = shuffleArray(brands)

    // Create chunks with different sizes
    const row1Size = Math.floor(shuffledBrands.length * 0.4) // 40% of logos
    const row2Size = Math.floor(shuffledBrands.length * 0.35) // 35% of logos
    // remaining logos go to row 3

    return [
      shuffledBrands.slice(0, row1Size),
      shuffledBrands.slice(row1Size, row1Size + row2Size),
      shuffledBrands.slice(row1Size + row2Size)
    ]
  }, [brands])

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
  brands: QueryType["company"]["clients"]["clientList"]["items"]
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
