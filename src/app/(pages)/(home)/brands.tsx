import type { QueryType } from "./query"
import { Scalars } from "../../../../.basehub/schema"
import { BrandsContent } from "@/components/brands"

export type Brand = {
  _id: Scalars["String"]
  _title: Scalars["String"]
  logo: Scalars["String"] | null
  website: Scalars["String"] | null
}

export const Brands = ({ data }: { data: QueryType }) => {
  const brands =
    data.company.clients?.clientList.items.filter((c) => c.logo) ?? []

  return <BrandsContent brands={brands} />
}
