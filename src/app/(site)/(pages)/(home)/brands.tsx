import { Suspense } from "react"

import { BrandsDesktop } from "@/components/brands"
import { getImageUrl } from "@/service/sanity/helpers"

import { BrandsMobile } from "./brands-mobile"
import type { HomepageData, SanityClient } from "./sanity"

export type Brand = {
  _id: string
  _title: string
  logo: { src: string; width: number; height: number; alt: string } | null
  website: string | null
}

/** Convert Sanity client data to the Brand shape used by brand components. */
function toBrand(client: SanityClient): Brand {
  const img = getImageUrl(client.logo)
  return {
    _id: client._id,
    _title: client.title,
    logo: img
      ? { src: img.src, width: img.width, height: img.height, alt: img.alt }
      : null,
    website: client.website
  }
}

export const Brands = ({ data }: { data: HomepageData }) => {
  const brands = (data.homepage.clients ?? [])
    .map(toBrand)
    .filter(
      (c): c is Brand & { logo: NonNullable<Brand["logo"]> } => c.logo !== null
    )

  // Trim to a multiple of 3 for the mobile grid. Deterministic (drop from the
  // end) so the homepage prerenders — a random drop reads as unstable IO.
  const mobileBrands = brands.slice(0, brands.length - (brands.length % 3))

  return (
    <Suspense fallback={null}>
      <BrandsDesktop brands={brands} />
      <BrandsMobile
        brandsMobile={[
          mobileBrands.slice(0, mobileBrands.length / 2),
          mobileBrands.slice(mobileBrands.length / 2)
        ]}
      />
    </Suspense>
  )
}
