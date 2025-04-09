import { BrandsDesktop } from "@/components/brands"

import { Scalars } from "../../../../.basehub/schema"
import { BrandsMobile } from "./brands-mobile"
import type { QueryType } from "./query"

export type Brand = {
  _id: Scalars["String"]
  _title: Scalars["String"]
  logo: Scalars["String"] | null
  website: Scalars["String"] | null
}

export const Brands = ({ data }: { data: QueryType }) => {
  const brands =
    data.company.clients?.clientList.items.filter((c) => c.logo) ?? []

  // Ensure we have a number of brands that's a multiple of 3 for the mobile grid
  const mobileBrands = [...brands]
  while (mobileBrands.length % 3 !== 0) {
    const randomIndex = Math.floor(Math.random() * mobileBrands.length)
    mobileBrands.splice(randomIndex, 1)
  }

  return (
    <>
      <BrandsDesktop brands={brands} />
      <BrandsMobile
        brandsMobile={[
          mobileBrands.slice(0, mobileBrands.length / 2),
          mobileBrands.slice(mobileBrands.length / 2)
        ]}
      />
    </>
  )
}
