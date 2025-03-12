"use client"
import { Marquee, useMarquee } from "@joycostudio/marquee/react"
import { useLenis } from "lenis/react"
import { useMemo, useRef } from "react"

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
  const isMobile = useMedia("(max-width: 1024px)")

  const [ref1, marquee1] = useMarquee({
    speed: 25,
    speedFactor: 0.1,
    direction: 1,
    play: isMobile
  })

  const [ref2, marquee2] = useMarquee({
    speed: 25,
    speedFactor: 0.1,
    direction: -1,
    play: isMobile
  })

  const [ref3, marquee3] = useMarquee({
    speed: 25,
    speedFactor: 0.1,
    direction: 1,
    play: isMobile
  })

  const lastSign = useRef<number>(1)

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

  useLenis(({ velocity }) => {
    if (!marquee1 || !marquee2 || !marquee3) return
    const sign = Math.sign(velocity)
    if (sign === 0) return
    lastSign.current = sign
    const speedFactor = (1 * sign + velocity / 10) * 0.1
    marquee1.setSpeedFactor(speedFactor)
    marquee2.setSpeedFactor(-speedFactor)
    marquee3.setSpeedFactor(speedFactor)
  })

  return (
    <section className="grid-layout isolate !gap-y-0 lg:!hidden">
      <div className="grid-layout col-span-full !px-0">
        <h3 className="col-span-full mb-2 text-mobile-h3 text-brand-g1 lg:col-start-3 lg:col-end-7 lg:text-h3">
          Trusted by Visionaries
        </h3>

        <div className="col-span-full h-px w-full bg-brand-w1/30" />
      </div>

      <div className="relative col-span-full flex flex-col divide-y divide-brand-w1/30">
        <div className="relative py-2">
          <div className="absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-brand-k to-transparent" />
          <div className="absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-brand-k to-transparent" />
          <Marquee instance={[ref1, marquee1]}>
            <div className="flex w-full items-center gap-x-2">
              {rows[0].map((brand) => (
                <div
                  key={brand._id}
                  className="[&>svg]:h-8 [&>svg]:w-auto"
                  dangerouslySetInnerHTML={{ __html: brand.logo ?? "" }}
                />
              ))}
            </div>
          </Marquee>
        </div>

        <div className="relative py-2">
          <div className="absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-brand-k to-transparent" />
          <div className="absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-brand-k to-transparent" />
          <Marquee instance={[ref2, marquee2]}>
            <div className="flex w-full items-center gap-x-2">
              {rows[1].map((brand) => (
                <div
                  key={brand._id}
                  className="[&>svg]:h-8 [&>svg]:w-auto"
                  dangerouslySetInnerHTML={{ __html: brand.logo ?? "" }}
                />
              ))}
            </div>
          </Marquee>
        </div>

        <div className="relative py-2">
          <div className="absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-brand-k to-transparent" />
          <div className="absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-brand-k to-transparent" />
          <Marquee instance={[ref3, marquee3]}>
            <div className="flex w-full items-center gap-x-2">
              {rows[2].map((brand) => (
                <div
                  key={brand._id}
                  className="[&>svg]:h-8 [&>svg]:w-auto"
                  dangerouslySetInnerHTML={{ __html: brand.logo ?? "" }}
                />
              ))}
            </div>
          </Marquee>
        </div>
      </div>
    </section>
  )
}
