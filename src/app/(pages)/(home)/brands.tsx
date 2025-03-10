"use client"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { ExternalLinkIcon } from "@/components/icons/icons"
import { Arrow } from "@/components/primitives/icons/arrow"
import { ANIMATION_CONFIG } from "@/constants/inspectables"
import useDebounceValue from "@/hooks/use-debounce-value"
import { useMedia } from "@/hooks/use-media"
import { cn } from "@/utils/cn"

import type { QueryType } from "./query"

export const Brands = ({ data }: { data: QueryType }) => {
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null)
  const debouncedHoveredBrand = useDebounceValue(hoveredBrand, 50)
  const isDesktop = useMedia("(min-width: 1024px)")
  const isTablet = useMedia("(min-width: 768px)")

  const rows = useMemo(() => {
    const brands =
      data.company.clients?.clientList.items.filter((c) => c.logo) ?? []

    const chunkSize = isDesktop ? 9 : isTablet ? 6 : 4

    return brands.reduce<
      { logo: string | null; website: string | null; _id: string }[][]
    >((acc, brand, index) => {
      const rowIndex = Math.floor(index / chunkSize)
      if (!acc[rowIndex]) {
        acc[rowIndex] = []
      }
      acc[rowIndex].push(brand)
      return acc
    }, [])
  }, [data.company.clients?.clientList.items, isDesktop, isTablet])

  const hoveredBrandData = useMemo(() => {
    return data.company.clients?.clientList.items.find(
      (c) => c._id === debouncedHoveredBrand
    )
  }, [data.company.clients?.clientList.items, debouncedHoveredBrand])

  return (
    <section className="grid-layout !gap-y-0">
      <div className="grid-layout col-span-full !px-0">
        <h3 className="col-span-full mb-2 text-mobile-h3 text-brand-g1 lg:col-start-3 lg:col-end-7 lg:text-h3">
          Trusted by{" "}
          <AnimatePresence mode="wait">
            {hoveredBrandData && isDesktop ? (
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-x-2 text-mobile-h3 text-brand-w1 lg:text-h3"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key="brand-name"
                transition={ANIMATION_CONFIG}
              >
                {hoveredBrandData._title}{" "}
                <ExternalLinkIcon className="size-4" />
              </motion.span>
            ) : (
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key="visionaries"
                transition={ANIMATION_CONFIG}
              >
                Visionaries
              </motion.span>
            )}
          </AnimatePresence>
        </h3>

        <div className="col-span-12 h-px w-full bg-brand-w1/30" />
      </div>

      <div className="relative col-span-full lg:col-start-3 lg:col-end-13">
        <div className="flex w-full flex-col divide-y divide-brand-w1/30">
          {rows.map((row, rowIndex) => (
            <div
              key={`brands-row-${row[0]?._id ?? rowIndex}`}
              className="flex items-center justify-between py-3 md:justify-start"
            >
              {row.map((brand) => (
                <Link
                  href={brand.website ?? ""}
                  target="_blank"
                  key={brand._id}
                  dangerouslySetInnerHTML={{ __html: brand.logo ?? "" }}
                  className={cn(
                    "actionable transition-opacity duration-300 [&>svg]:w-16 sm:[&>svg]:w-auto",
                    {
                      "opacity-50": debouncedHoveredBrand !== brand._id,
                      "opacity-100": debouncedHoveredBrand === null
                    }
                  )}
                  onMouseEnter={() => setHoveredBrand(brand._id)}
                  onMouseLeave={() => setHoveredBrand(null)}
                />
              ))}
            </div>
          ))}
          <div />
        </div>
      </div>

      <div className="relative col-span-full -mt-px flex aspect-[5/1] items-end lg:col-start-3 lg:col-end-5 lg:aspect-[3.1/1]">
        <Link
          href="/showcase"
          className="actionable relative z-10 flex items-center gap-x-1 bg-brand-k text-h4 text-brand-w1"
        >
          <span>Call to Action</span> <Arrow className="size-5" />
        </Link>

        <div className="with-diagonal-lines !absolute inset-0" />
      </div>
    </section>
  )
}
