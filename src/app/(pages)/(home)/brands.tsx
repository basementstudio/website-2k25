import Link from "next/link"

import { Arrow } from "@/components/primitives/icons/arrow"

import { QueryType } from "./query"

export const Brands = ({ data }: { data: QueryType }) => {
  const brands =
    data.company.clients?.clientList.items.filter((c) => c.logo) ?? []

  // Create chunks of 9 brands per row
  const rows = brands.reduce<
    { logo: string | null; website: string | null; _id: string }[][]
  >((acc, brand, index) => {
    const rowIndex = Math.floor(index / 9)
    if (!acc[rowIndex]) {
      acc[rowIndex] = []
    }
    acc[rowIndex].push(brand)
    return acc
  }, [])

  return (
    <section className="grid-layout !gap-y-0">
      <div className="grid-layout col-span-12 !px-0">
        <h3 className="col-start-3 col-end-6 text-h3 text-brand-g1">
          Trusted by Visionaries
        </h3>

        <div className="col-span-12 h-px w-full bg-brand-w1/30" />
      </div>

      <div className="relative col-start-3 col-end-13">
        <div className="flex w-full flex-col divide-y divide-brand-w1/30">
          {rows.map((row, index) => (
            <div
              key={`brands-row-${index}`}
              className="flex items-center gap-x-8 py-4"
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

      <div className="relative col-start-3 col-end-5 flex aspect-[16/5] items-end">
        <Link
          href="/showcase"
          className="actionable relative z-[1] flex items-center gap-x-2 bg-brand-k text-h4 text-brand-w1"
        >
          Call to Action <Arrow className="size-4" />
        </Link>

        <div className="with-diagonal-lines !absolute inset-0" />
      </div>
    </section>
  )
}
