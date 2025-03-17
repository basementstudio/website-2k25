import type { QueryType } from "./query"
import { Scalars } from "../../../../.basehub/schema"
import { BrandsContent } from "@/components/brands"

const MARQUEE_BRANDS_CHUNK_SIZE = 7

export type Brand = {
  _id: Scalars["String"]
  _title: Scalars["String"]
  logo: Scalars["String"] | null
  website: Scalars["String"] | null
}

const getMarqueeBrandsRows = (
  brands: {
    _id: Scalars["String"]
    _title: Scalars["String"]
    logo: Scalars["String"] | null
    website: Scalars["String"] | null
  }[]
): Brand[][] => {
  if (!brands.length) return []

  const rowCount = Math.ceil(brands.length / MARQUEE_BRANDS_CHUNK_SIZE)
  const rows: Brand[][] = new Array(rowCount)

  for (let i = 0; i < rowCount; i++) {
    rows[i] = []
  }
  for (let i = 0; i < brands.length; i++) {
    const rowIndex = Math.floor(i / MARQUEE_BRANDS_CHUNK_SIZE)
    rows[rowIndex].push(brands[i])
  }

  return rows
}

export const Brands = ({ data }: { data: QueryType }) => {
  const brands =
    data.company.clients?.clientList.items.filter((c) => c.logo) ?? []

  return (
    <BrandsContent
      brands={brands}
      marqueeBrandsRows={getMarqueeBrandsRows(brands)}
    />
  )
}
