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

  return (
    <>
      <BrandsDesktop brands={brands} />
      <BrandsMobile
        brandsMobile={[
          brands.slice(0, brands.length / 2),
          brands.slice(brands.length / 2)
        ]}
      />
    </>
  )
}
