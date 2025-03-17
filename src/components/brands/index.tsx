"use client"

import { AnimatePresence, motion } from "motion/react"
import { memo, useMemo, useState } from "react"

import { ExternalLinkIcon } from "@/components/icons/icons"

import useDebounceValue from "@/hooks/use-debounce-value"
import { useMedia } from "@/hooks/use-media"
import { Brand } from "@/app/(pages)/(home)/brands"

const DEBOUNCE_DELAY = 50
const BREAKPOINTS = {
  DESKTOP: "(min-width: 1280px)"
} as const

const SVGLogo = memo(({ svg }: { svg: string | null }) => {
  if (!svg) return null
  return (
    <div
      className="with-dots relative grid h-full w-full place-items-center"
      ref={(node) => {
        if (node) node.innerHTML = svg
      }}
    />
  )
})

SVGLogo.displayName = "SVGLogo"

export const AnimatedTitle = memo(
  ({ brandName, enabled }: { enabled: boolean; brandName: string }) => (
    <AnimatePresence mode="wait">
      {brandName && enabled ? (
        <motion.span
          animate={{ opacity: 1, y: 0 }}
          className="ml-px inline-flex items-center gap-x-2 text-mobile-h3 text-brand-w1 lg:text-h3"
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
  )
)

AnimatedTitle.displayName = "AnimatedTitle"

export const BrandsContent = ({ brands }: { brands: Brand[] }) => {
  const [hoveredBrandId, setHoveredBrandId] = useState<string | null>(null)
  const isDesktop = useMedia(BREAKPOINTS.DESKTOP)
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

  return (
    <section className="lg:grid-layout hidden !gap-y-0">
      <div className="grid-layout col-span-full !px-0">
        <p className="col-start-1 text-mobile-h3 text-brand-g1 lg:text-h3">
          (1)
        </p>
        <h3 className="col-span-full mb-2 text-mobile-h3 text-brand-g1 lg:col-start-2 lg:text-h3 2xl:col-start-3">
          Trusted by{" "}
          <AnimatedTitle
            brandName={hoveredBrandName ?? ""}
            enabled={isDesktop ?? false}
          />
        </h3>
      </div>

      <div className="relative col-span-full">
        <div className="grid-rows-auto group grid grid-cols-6 gap-3 xl:grid-cols-8">
          {brands.map((brand) => (
            <motion.a
              className="aspect-[202/110] text-brand-w1 [&>svg]:w-16 sm:[&>svg]:w-auto"
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
            >
              <div className="relative h-full after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
                <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <SVGLogo svg={brand.logo} />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}

BrandsContent.displayName = "BrandsContent"
