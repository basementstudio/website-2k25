import type { Metadata } from "next"

import { Contact } from "@/components/layout/contact"

import { fetchHomepage } from "./basehub"
import { Brands } from "./brands"
import { Capabilities } from "./capabilities"
import { FeaturedProjects } from "./featured-projects"
import { Intro } from "./intro"

export const metadata: Metadata = {
  title: {
    absolute: "basement.studio | We make cool shit that performs."
  },
  description:
    "basement is a boutique studio that brings what brands envision to life, through branding, visual design & development of the highest quality."
}

const Homepage = async () => {
  const data = await fetchHomepage()

  return (
    <div className="flex flex-col gap-18 lg:gap-32">
      <Intro data={data} />
      <Brands data={data} />
      <FeaturedProjects data={data} />
      <Capabilities data={data} />
      <Contact />
    </div>
  )
}

export default Homepage
