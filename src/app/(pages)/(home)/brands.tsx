"use client"

import { AnimatePresence, motion } from "motion/react"
import { memo, useMemo, useState } from "react"

import { ExternalLinkIcon } from "@/components/icons/icons"
import useDebounceValue from "@/hooks/use-debounce-value"
import { useMedia } from "@/hooks/use-media"

import type { QueryType } from "./query"

const DEBOUNCE_DELAY = 50
const BREAKPOINTS = {
  BIG_DESKTOP: "(min-width: 1536px)",
  DESKTOP: "(min-width: 1280px)",
  TABLET: "(min-width: 768px)"
} as const

const CHUNK_SIZES = {
  BIG_DESKTOP: 9,
  DESKTOP: 9,
  TABLET: 7
} as const

const SVGLogo = memo(({ svg }: { svg: string | null }) => {
  if (!svg) return null
  return (
    <div
      className="h-full w-full"
      ref={(node) => {
        if (node) node.innerHTML = svg
      }}
    />
  )
})

SVGLogo.displayName = "SVGLogo"

const BrandRow = memo(
  ({
    row,
    setHoveredBrand,
    debouncedHoveredBrand
  }: {
    debouncedHoveredBrand: string | null
    row: Array<{ logo: string | null; website: string | null; _id: string }>
    setHoveredBrand: (id: string | null) => void
  }) => (
    <div className="flex items-center justify-between md:justify-start">
      {row.map((brand) => (
        <motion.a
          className="-my-px py-[13px] text-brand-w1 [&>svg]:w-16 sm:[&>svg]:w-auto"
          href={brand.website ?? ""}
          key={brand._id}
          onMouseEnter={() => setHoveredBrand(brand._id)}
          onMouseLeave={() => setHoveredBrand(null)}
          rel="noopener noreferrer"
          target="_blank"
          animate={{
            opacity: debouncedHoveredBrand
              ? debouncedHoveredBrand === brand._id
                ? 1
                : 0.5
              : 1
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <SVGLogo svg={brand.logo} />
        </motion.a>
      ))}
    </div>
  )
)

BrandRow.displayName = "BrandRow"

const AnimatedTitle = memo(
  ({
    hoveredBrandData,
    enabled
  }: {
    enabled: boolean
    hoveredBrandData:
      | QueryType["company"]["clients"]["clientList"]["items"][0]
      | undefined
  }) => (
    <AnimatePresence mode="wait">
      {hoveredBrandData && enabled ? (
        <motion.span
          animate={{ opacity: 1, y: 0 }}
          className="ml-px inline-flex items-center gap-x-2 text-mobile-h3 text-brand-w1 lg:text-h3"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 10 }}
          key="brand-name"
          transition={{ ease: "easeOut", duration: 0.2 }}
        >
          {hoveredBrandData._title} <ExternalLinkIcon className="size-4" />
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

export const Brands = ({ data }: { data: QueryType }) => {
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null)
  const debouncedHoveredBrand = useDebounceValue(hoveredBrand, DEBOUNCE_DELAY)
  const isDesktop = useMedia(BREAKPOINTS.DESKTOP)
  const isBigDesktop = useMedia(BREAKPOINTS.BIG_DESKTOP)

  const brands = useMemo(
    () => data.company.clients?.clientList.items.filter((c) => c.logo) ?? [],
    [data.company.clients?.clientList.items]
  )

  const rows = useMemo(() => {
    const chunkSize = isBigDesktop
      ? CHUNK_SIZES.BIG_DESKTOP
      : isDesktop
        ? CHUNK_SIZES.DESKTOP
        : CHUNK_SIZES.TABLET

    return brands.reduce<(typeof brands)[]>((acc, brand, index) => {
      const rowIndex = Math.floor(index / chunkSize)
      if (!acc[rowIndex]) {
        acc[rowIndex] = []
      }
      acc[rowIndex].push(brand)
      return acc
    }, [])
  }, [brands, isBigDesktop, isDesktop])

  const brandsMap = useMemo(() => {
    const map = new Map()

    for (const item of data.company.clients?.clientList.items ?? []) {
      map.set(item._id, item)
    }

    return map
  }, [data.company.clients?.clientList.items])

  const hoveredBrandData = useMemo(() => {
    return debouncedHoveredBrand
      ? brandsMap.get(debouncedHoveredBrand)
      : undefined
  }, [brandsMap, debouncedHoveredBrand])

  return (
    <section className="lg:grid-layout hidden !gap-y-0">
      <div className="grid-layout col-span-full !px-0">
        <h3 className="col-span-full mb-2 text-mobile-h3 text-brand-g1 lg:col-start-2 lg:text-h3 2xl:col-start-3">
          Trusted by{" "}
          <AnimatedTitle
            hoveredBrandData={hoveredBrandData}
            enabled={isDesktop ?? false}
          />
        </h3>
      </div>

      <div className="relative col-span-full lg:col-start-2 2xl:col-start-3">
        <div className="group flex w-fit flex-col divide-y divide-brand-w1/30">
          {rows.map((row, rowIndex) => (
            <BrandRow
              key={`brands-row-${row[0]?._id ?? rowIndex}`}
              row={row}
              debouncedHoveredBrand={debouncedHoveredBrand}
              setHoveredBrand={setHoveredBrand}
            />
          ))}
          <div />
        </div>
      </div>
    </section>
  )
}
