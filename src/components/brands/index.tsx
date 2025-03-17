"use client"

import { AnimatePresence, motion } from "motion/react"
import { memo, useMemo, useState } from "react"

import { ExternalLinkIcon } from "@/components/icons/icons"

import useDebounceValue from "@/hooks/use-debounce-value"
import { useMedia } from "@/hooks/use-media"
import { Brand, GetBreakpointRows } from "@/app/(pages)/(home)/brands"

const DEBOUNCE_DELAY = 50
const BREAKPOINTS = {
  BIG_DESKTOP: "(min-width: 1536px)",
  DESKTOP: "(min-width: 1280px)",
  TABLET: "(min-width: 768px)"
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

export const BrandRow = memo(
  ({
    row,
    rowIndex,
    setHoveredBrand,
    hoveredBrandId
  }: {
    hoveredBrandId: string | undefined
    row: Brand[]
    rowIndex: number
    setHoveredBrand: (brand: { id: string; rowIndex: number } | null) => void
  }) => (
    <div className="flex items-center justify-between md:justify-start">
      {row.map((brand) => (
        <motion.a
          className="-my-px py-[13px] text-brand-w1 [&>svg]:w-16 sm:[&>svg]:w-auto"
          href={brand.website ?? ""}
          key={brand._id}
          onMouseEnter={() => setHoveredBrand({ id: brand._id, rowIndex })}
          onMouseLeave={() => setHoveredBrand(null)}
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
          <SVGLogo svg={brand.logo} />
        </motion.a>
      ))}
    </div>
  )
)

BrandRow.displayName = "BrandRow"

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

export const BrandsContent = ({
  brandsItemsRows
}: {
  brandsItemsRows: GetBreakpointRows
}) => {
  const [hoveredBrand, setHoveredBrand] = useState<{
    id: string
    rowIndex: number
  } | null>(null)
  const debouncedHoveredBrand = useDebounceValue(hoveredBrand, DEBOUNCE_DELAY)
  const isDesktop = useMedia(BREAKPOINTS.DESKTOP)

  const rows: Brand[][] = useMemo(() => {
    return isDesktop ? brandsItemsRows.DESKTOP : brandsItemsRows.TABLET
  }, [brandsItemsRows, isDesktop])

  const hoveredBrandName: string | undefined = useMemo(() => {
    if (debouncedHoveredBrand) {
      return rows[debouncedHoveredBrand.rowIndex].find(
        (row) => row._id === debouncedHoveredBrand.id
      )?._title
    } else {
      return undefined
    }
  }, [rows, debouncedHoveredBrand])

  return (
    <section className="lg:grid-layout hidden !gap-y-0">
      <div className="grid-layout col-span-full !px-0">
        <h3 className="col-span-full mb-2 text-mobile-h3 text-brand-g1 lg:col-start-2 lg:text-h3 2xl:col-start-3">
          Trusted by{" "}
          <AnimatedTitle
            brandName={hoveredBrandName ?? ""}
            enabled={isDesktop ?? false}
          />
        </h3>
      </div>

      <div className="relative col-span-full lg:col-start-2 2xl:col-start-3">
        <div className="group flex w-fit flex-col divide-y divide-brand-w1/30">
          {rows.map((row, rowIndex) => (
            <BrandRow
              rowIndex={rowIndex}
              key={`brands-row-${rowIndex}`}
              row={row}
              hoveredBrandId={debouncedHoveredBrand?.id}
              setHoveredBrand={setHoveredBrand}
            />
          ))}
          <div />
        </div>
      </div>
    </section>
  )
}

BrandsContent.displayName = "BrandsContent"
