import type { Metadata } from "next"

import { BrandsMobile } from "./brands-mobile"

export const metadata: Metadata = {
  title: "We make cool shit that performs.",
  description:
    "basement is a boutique studio that brings what brands envision to life, through branding, visual design & development of the highest quality."
}

const Homepage = async () => {
  return (
    <div className="flex flex-col gap-18 lg:gap-44">
      <BrandsMobile />
    </div>
  )
}

export default Homepage
