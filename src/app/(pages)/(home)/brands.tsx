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

const getBrandsMobile = (brands: Brand[]) => {
  // Check if brands lenght is multiple of 6
  if (brands.length % 6 !== 0) {
    // if not, remove exceeded brands
    const brandsToRemove = brands.length % 6
    const brandsToKeep = brands.length - brandsToRemove
    return [brands.slice(0, brandsToKeep / 2), brands.slice(brandsToKeep / 2)]
  }

  return [brands.slice(0, brands.length / 2), brands.slice(brands.length / 2)]
}

export const Brands = ({ data }: { data: QueryType }) => {
  const brands =
    data.company.clients?.clientList.items.filter((c) => c.logo) ?? []

  return (
    <>
      <BrandsDesktop brands={brands} />
      <BrandsMobile brandsMobile={getBrandsMobile(brands)} />
    </>
  )
}
