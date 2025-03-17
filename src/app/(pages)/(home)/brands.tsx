import type { QueryType } from "./query"
import { Scalars } from "../../../../.basehub/schema"
import { BrandsContent } from "@/components/brands"

const CHUNK_SIZES = {
  DESKTOP: 9,
  TABLET: 7
} as const

export type Brand = {
  _id: Scalars["String"]
  _title: Scalars["String"]
  logo: Scalars["String"] | null
  website: Scalars["String"] | null
}

export type GetBreakpointRows = {
  DESKTOP: Brand[][]
  TABLET: Brand[][]
}

const generateRows = (brands: Brand[], chunkSize: number): Brand[][] => {
  if (!brands.length) return []

  const rowCount = Math.ceil(brands.length / chunkSize)
  const rows: Brand[][] = new Array(rowCount)

  for (let i = 0; i < rowCount; i++) {
    rows[i] = []
  }
  for (let i = 0; i < brands.length; i++) {
    const rowIndex = Math.floor(i / chunkSize)
    rows[rowIndex].push(brands[i])
  }

  return rows
}

const getBreakpointRows = (
  brands: {
    _id: Scalars["String"]
    _title: Scalars["String"]
    logo: Scalars["String"] | null
    website: Scalars["String"] | null
  }[]
): GetBreakpointRows => {
  if (!brands.length) {
    return {
      DESKTOP: [],
      TABLET: []
    }
  }

  const breakpointMap = new Map<number, Brand[][]>()

  const getRowsForChunkSize = (chunkSize: number): Brand[][] => {
    if (!breakpointMap.has(chunkSize)) {
      breakpointMap.set(chunkSize, generateRows(brands, chunkSize))
    }
    return breakpointMap.get(chunkSize)!
  }

  return {
    DESKTOP: getRowsForChunkSize(CHUNK_SIZES.DESKTOP),
    TABLET: getRowsForChunkSize(CHUNK_SIZES.TABLET)
  }
}

export const Brands = ({ data }: { data: QueryType }) => {
  const brands =
    data.company.clients?.clientList.items.filter((c) => c.logo) ?? []

  const rows = getBreakpointRows(brands)

  return <BrandsContent brandsItemsRows={rows} />
}
