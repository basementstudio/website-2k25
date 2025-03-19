"use client"

import { useEffect, useState } from "react"

import { cn } from "@/utils/cn"

import { Brand } from "./brands"

export const BrandsMobile = ({ brandsMobile }: { brandsMobile: Brand[][] }) => {
  return (
    <section className="grid-layout isolate !gap-y-0 lg:!hidden">
      <div className="grid-layout col-span-full !px-0">
        <h3 className="col-span-full mb-2 text-mobile-h3 text-brand-g1 lg:col-start-3 lg:col-end-7 lg:text-h3">
          Trusted by Visionaries
        </h3>

        <div className="col-span-full h-px w-full bg-brand-w1/30" />
      </div>

      <div className="relative col-span-full flex flex-col">
        {brandsMobile.map((row, index) => (
          <BrandsGrid key={index} brands={row} absolute={index !== 0} />
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
  absolute: boolean
}

const CYCLE_DURATION = 10000

const getPositionDelay = (idx: number) => {
  return Number((2 + 2 * Math.sin(1.2 * idx + Math.PI / 4)).toFixed(2))
}

const BrandsGrid = ({ brands, absolute }: MarqueeRowProps) => {
  const [switchState, setSwitchState] = useState(absolute)

  useEffect(() => {
    const interval = setInterval(() => {
      setSwitchState((prev) => !prev)
    }, CYCLE_DURATION)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn("relative py-2", absolute && "absolute inset-0")}>
      <div className="grid-rows-auto group grid grid-cols-3 gap-3">
        {brands.map((brand, idx) => {
          const delay = getPositionDelay(idx)
          return (
            <div
              key={brand._id}
              className={cn(
                "relative h-full transition-opacity duration-500 after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20",
                switchState && "opacity-0",
                !switchState && "opacity-100",
                "delay-[var(--delay)]"
              )}
              style={
                {
                  "--delay": `${delay}s`,
                  animationTimingFunction: "cubic-bezier(0.4, 0, 0.6, 1)"
                } as React.CSSProperties
              }
            >
              <div
                className="with-dots relative grid h-full w-full place-items-center px-2 py-4 [&>svg]:max-w-[100%]"
                dangerouslySetInnerHTML={{ __html: brand.logo ?? "" }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
