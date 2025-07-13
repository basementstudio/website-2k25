import type { Metadata } from "next"

import { Contact } from "@/components/layout/contact"

import { fetchHomepage } from "./basehub"
import { Brands } from "./brands"
import { Capabilities } from "./capabilities"
import { FeaturedProjects } from "./featured-projects"
import { Intro } from "./intro"

export const metadata: Metadata = {
  title: {
    absolute: "XMCP | We make cool shit that performs."
  },
  alternates: {
    canonical: "https://xmcp.dev"
  }
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
