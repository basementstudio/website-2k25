"use client"
import Link from "next/link"
import { useMemo, useState } from "react"

import { ExternalLinkIcon } from "@/components/icons/icons"
import { Arrow } from "@/components/primitives/icons/arrow"
import useDebounceValue from "@/hooks/use-debounce-value"
import { useMedia } from "@/hooks/use-media"
import { cn } from "@/utils/cn"

import { QueryType } from "./query"

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
        <h3 className="col-span-full mb-2 text-mobile-h3 text-brand-g1 lg:col-start-3 lg:col-end-6 lg:text-h3">
          Trusted by Visionaries
        </h3>

        {hoveredBrandData && isDesktop ? (
          <h4 className="mb-2 inline-flex items-center gap-x-2 text-mobile-h3 text-brand-w1 lg:col-start-6 lg:col-end-9 lg:text-h3">
            {hoveredBrandData._title} <ExternalLinkIcon className="size-4" />
          </h4>
        ) : null}

        <div className="col-span-12 h-px w-full bg-brand-w1/30" />
      </div>

      <div className="relative col-span-full lg:col-start-3 lg:col-end-13">
        <div className="flex w-full flex-col divide-y divide-brand-w1/30">
          {rows.map((row, index) => (
            <div
              key={`brands-row-${index}`}
              className="flex items-center justify-between py-3 md:justify-start"
            >
              {row.map((brand) => (
                <Link
                  href={brand.website ?? ""}
                  target="_blank"
                  key={brand._id}
                  dangerouslySetInnerHTML={{
                    __html: `<span class="actionable-opacity">${brand.logo}</span>`
                  }}
                  className="text-brand-w1 [&>svg]:w-16 sm:[&>svg]:w-auto [&>svg_path]:fill-current"
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
          className="relative z-10 bg-brand-k text-h4 text-brand-w1"
        >
          <span className="actionable flex items-center gap-x-1">
            Call to Action
            <Arrow className="size-5" />
          </span>
        </Link>

        <div className="with-diagonal-lines !absolute inset-0" />
      </div>
    </section>
  )
}
