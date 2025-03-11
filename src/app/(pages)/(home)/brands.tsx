"use client"

import { AnimatePresence, motion } from "motion/react"
import { memo, useMemo, useState } from "react"

import { ExternalLinkIcon } from "@/components/icons/icons"
import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"
import useDebounceValue from "@/hooks/use-debounce-value"
import { useMedia } from "@/hooks/use-media"
import { cn } from "@/utils/cn"

import type { QueryType } from "./query"

const DEBOUNCE_DELAY = 50
const BREAKPOINTS = {
  DESKTOP: "(min-width: 1024px)",
  TABLET: "(min-width: 768px)"
} as const

const CHUNK_SIZES = {
  DESKTOP: 9,
  TABLET: 6,
  MOBILE: 4
} as const

const BrandLogo = memo(
  ({
    brand,
    onMouseEnter,
    onMouseLeave,
    className
  }: {
    brand: { website: string | null; logo: string | null; _id: string }
    onMouseEnter: () => void
    onMouseLeave: () => void
    className?: string
  }) => (
    <Link
      dangerouslySetInnerHTML={{
        __html: brand.logo ?? ""
      }}
      className={cn(
        "-my-px py-[13px] text-brand-w1 [&>svg]:w-16 sm:[&>svg]:w-auto",
        className
      )}
      href={brand.website ?? ""}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      rel="noopener noreferrer"
      target="_blank"
    />
  )
)

BrandLogo.displayName = "BrandLogo"

const BrandRow = memo(
  ({
    row,
    setHoveredBrand
  }: {
    debouncedHoveredBrand: string | null
    row: Array<{ logo: string | null; website: string | null; _id: string }>
    setHoveredBrand: (id: string | null) => void
  }) => (
    <div className="flex items-center justify-between md:justify-start group-hover:[&>a:not(:hover)]:opacity-50">
      {row.map((brand) => (
        <BrandLogo
          key={brand._id}
          brand={brand}
          onMouseEnter={() => setHoveredBrand(brand._id)}
          onMouseLeave={() => setHoveredBrand(null)}
          className="transition-opacity duration-100 ease-linear"
        />
      ))}
    </div>
  )
)

BrandRow.displayName = "BrandRow"

const AnimatedTitle = memo(
  ({
    hoveredBrandData,
    isDesktop
  }: {
    hoveredBrandData:
      | QueryType["company"]["clients"]["clientList"]["items"][0]
      | undefined
    isDesktop: boolean | undefined
  }) => (
    <AnimatePresence mode="wait">
      {hoveredBrandData && isDesktop ? (
        <motion.span
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-x-2 text-mobile-h3 text-brand-w1 lg:text-h3"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 10 }}
          key="brand-name"
        >
          {hoveredBrandData._title} <ExternalLinkIcon className="size-4" />
        </motion.span>
      ) : (
        <motion.span
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 10 }}
          key="visionaries"
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
  const isTablet = useMedia(BREAKPOINTS.TABLET)

  const brands = useMemo(
    () => data.company.clients?.clientList.items.filter((c) => c.logo) ?? [],
    [data.company.clients?.clientList.items]
  )

  const rows = useMemo(() => {
    const chunkSize = isDesktop
      ? CHUNK_SIZES.DESKTOP
      : isTablet
        ? CHUNK_SIZES.TABLET
        : CHUNK_SIZES.MOBILE

    return brands.reduce<(typeof brands)[]>((acc, brand, index) => {
      const rowIndex = Math.floor(index / chunkSize)
      if (!acc[rowIndex]) {
        acc[rowIndex] = []
      }
      acc[rowIndex].push(brand)
      return acc
    }, [])
  }, [brands, isDesktop, isTablet])

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
    <section className="grid-layout !gap-y-0">
      <div className="grid-layout col-span-full !px-0">
        <h3 className="col-span-full mb-2 text-mobile-h3 text-brand-g1 lg:col-start-3 lg:col-end-7 lg:text-h3">
          Trusted by{" "}
          <AnimatedTitle
            hoveredBrandData={hoveredBrandData}
            isDesktop={isDesktop}
          />
        </h3>

        <div className="col-span-12 h-px w-full bg-brand-w1/30" />
      </div>

      <div className="relative col-span-full lg:col-start-3 lg:col-end-13">
        <div className="group flex w-full flex-col divide-y divide-brand-w1/30">
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

      <div className="relative col-span-full -mt-px flex aspect-[5/1] items-end lg:col-start-3 lg:col-end-5 lg:aspect-[3.1/1]">
        <Link
          href="/showcase"
          className="relative z-10 bg-brand-k text-h4 text-brand-w1"
        >
          <span className="actionable flex items-center gap-x-1">
            Call to Action
            <Arrow className="size-5" />
          </span>
        </Link>
      </div>
    </section>
  )
}
