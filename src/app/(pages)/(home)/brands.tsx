"use client"
import Link from "next/link"
import { useMemo } from "react"

import { Arrow } from "@/components/primitives/icons/arrow"
import { useMedia } from "@/hooks/use-media"

import { QueryType } from "./query"

export const Brands = ({ data }: { data: QueryType }) => {
  const isDesktop = useMedia("(min-width: 1024px)")

  const rows = useMemo(() => {
    const brands =
      data.company.clients?.clientList.items.filter((c) => c.logo) ?? []

    const chunkSize = isDesktop ? 9 : 3
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
  }, [data.company.clients?.clientList.items, isDesktop])

  return (
    <section className="grid-layout !gap-y-0">
      <div className="grid-layout col-span-full !px-0">
        <h3 className="text-mobile-h3 col-span-full mb-2 text-brand-g1 lg:col-start-3 lg:col-end-6 lg:text-h3">
          Trusted by Visionaries
        </h3>

        <div className="col-span-12 h-px w-full bg-brand-w1/30" />
      </div>

      <div className="relative col-span-full lg:col-start-3 lg:col-end-13">
        <div className="flex w-full flex-col divide-y divide-brand-w1/30">
          {rows.map((row, index) => (
            <div
              key={`brands-row-${index}`}
              className="flex items-center gap-x-9 py-3"
            >
              {row.map((brand) => (
                <Link
                  href={brand.website ?? ""}
                  target="_blank"
                  key={brand._id}
                  dangerouslySetInnerHTML={{ __html: brand.logo ?? "" }}
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
