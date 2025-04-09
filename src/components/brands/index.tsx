"use client"

import { AnimatePresence, motion } from "motion/react"
import { memo, useMemo, useState } from "react"

import { Brand } from "@/app/(pages)/(home)/brands"
import { ExternalLinkIcon } from "@/components/icons/icons"
import useDebounceValue from "@/hooks/use-debounce-value"
import { useMedia } from "@/hooks/use-media"
import { cn } from "@/utils/cn"

const DEBOUNCE_DELAY = 50

const SVGLogo = memo(({ svg }: { svg: string | null }) => {
  if (!svg) return null
  return (
    <div
      className="with-dots relative grid h-full w-full place-items-center px-2 [&>svg]:max-w-[100%]"
      ref={(node) => {
        if (node) node.innerHTML = svg
      }}
    />
  )
})

SVGLogo.displayName = "SVGLogo"

export const AnimatedTitle = memo(({ brandName }: { brandName: string }) => (
  <AnimatePresence mode="wait">
    {brandName ? (
      <motion.span
        animate={{ opacity: 1, y: 0 }}
        className="ml-px inline-flex items-center gap-x-2 text-f-h3-mobile text-brand-w1 lg:text-f-h3"
        exit={{ opacity: 0, y: -10 }}
        initial={{ opacity: 0, y: 10 }}
        key="brand-name"
        transition={{ ease: "easeOut", duration: 0.2 }}
      >
        {brandName} <ExternalLinkIcon className="size-4" />
      </motion.span>
    ) : (
      <motion.span
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        initial={{ opacity: 0, y: 10 }}
        key="visionaries"
        transition={{ ease: "easeOut", duration: 0.2 }}
      >
        Visionaries
      </motion.span>
    )}
  </AnimatePresence>
))

AnimatedTitle.displayName = "AnimatedTitle"

interface BrandsDesktopProps {
  brands: Brand[]
}

export const BrandsDesktop = memo(({ brands }: BrandsDesktopProps) => {
  const [hoveredBrandId, setHoveredBrandId] = useState<string | null>(null)
  const isLargeDesktop = useMedia("(min-width: 1280px)")
  const isDesktop = useMedia("(min-width: 1024px)")

  const debouncedHoveredBrandId = useDebounceValue(
    hoveredBrandId,
    DEBOUNCE_DELAY
  )

  const hoveredBrandName: string | undefined = useMemo(() => {
    if (debouncedHoveredBrandId) {
      return brands.find((row) => row._id === debouncedHoveredBrandId)?._title
    } else {
      return undefined
    }
  }, [brands, debouncedHoveredBrandId])

  const filteredBrands = useMemo(() => {
    if (isLargeDesktop) {
      // Ensure we display a multiple of 8 brands
      const count = Math.floor(brands.length / 8) * 8
      return brands.slice(0, count)
    } else {
      // Ensure we display a multiple of 6 brands
      const count = Math.floor(brands.length / 6) * 6
      return brands.slice(0, count)
    }
  }, [brands, isLargeDesktop])

  if (isDesktop === false) return null

  return (
    <section className="lg:grid-layout hidden !gap-y-4">
      <div className="grid-layout col-span-full !px-0">
        <h2 className="col-span-full text-f-h3-mobile text-brand-g1 lg:col-start-2 lg:text-f-h3 2xl:col-start-3">
          Trusted by <AnimatedTitle brandName={hoveredBrandName ?? ""} />
        </h2>
      </div>

      <div className="relative col-span-full">
        <div className="grid-rows-auto group grid grid-cols-6 gap-3 xl:grid-cols-8">
          {filteredBrands.map((brand) => (
            <motion.a
              className="aspect-[202/110] text-brand-w1 focus-visible:!ring-offset-0 [&>svg]:w-16 sm:[&>svg]:w-auto"
              href={brand.website ?? ""}
              key={brand._id}
              onMouseEnter={() => setHoveredBrandId(brand._id)}
              onMouseLeave={() => setHoveredBrandId(null)}
              rel="noopener noreferrer"
              target="_blank"
              animate={{
                opacity: hoveredBrandId
                  ? hoveredBrandId === brand._id
                    ? 1
                    : 0.5
                  : 1
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              title={brand._title}
            >
              <div className="relative h-full after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
                <div
                  className={cn(
                    "with-diagonal-lines pointer-events-none !absolute inset-0 opacity-0 transition-opacity duration-300",
                    hoveredBrandId === brand._id && "opacity-100"
                  )}
                />
                <SVGLogo svg={brand.logo} />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
})
