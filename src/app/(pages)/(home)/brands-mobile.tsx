import { cn } from "@/utils/cn"

import { Brand } from "./brands"

export const BrandsMobile = ({ brandsMobile }: { brandsMobile: Brand[][] }) => {
  return (
    <section className="grid-layout isolate !gap-y-0 lg:!hidden">
      <div className="grid-layout col-span-full !px-0">
        <h3 className="col-span-full mb-2 text-mobile-h3 text-brand-g1 lg:col-start-3 lg:col-end-7 lg:text-h3">
          Trusted by Visionaries
        </h3>
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

const getPositionDelay = (position: number, length: number) => {
  const seed = (position * 23 + 17) % 31
  return (seed * 1.5) % (length * 1.5)
}

const BrandsGrid = ({ brands, absolute }: MarqueeRowProps) => {
  return (
    <div className={cn("relative py-2", absolute && "absolute inset-0")}>
      <div className="grid-rows-auto group grid grid-cols-3 gap-3">
        {brands.map((brand, idx) => {
          const delay = getPositionDelay(idx, brands.length)
          return (
            <div
              key={brand._id}
              className={cn(
                "relative h-full after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20",
                absolute && "animate-fade-in-out opacity-0",
                !absolute && "animate-fade-out-in opacity-100"
              )}
              style={
                {
                  "--anim-duration": "16s",
                  "--anim-delay": `${delay}s`,
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
