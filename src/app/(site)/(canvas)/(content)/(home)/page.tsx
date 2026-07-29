import type { Metadata } from "next"

import { Contact } from "@/components/layout/contact"
import { JsonLd } from "@/lib/structured-data/json-ld"
import { generateWebSiteSchema } from "@/lib/structured-data/schemas/organization"
import { generateProfessionalServiceSchema } from "@/lib/structured-data/schemas/professional-service-entity"
import { fetchOrganizationData } from "@/service/sanity/organization"

import { AboutEntity } from "./about-entity"
import { Brands } from "./brands"
import { Capabilities } from "./capabilities"
import { FeaturedProjects } from "./featured-projects"
import { Intro } from "./intro"
import { fetchHomepage } from "./sanity"

export const metadata: Metadata = {
  title: {
    absolute: "basement.studio | We make cool shit that performs."
  },
  alternates: {
    canonical: "https://basement.studio"
  }
}

const Homepage = async () => {
  const [data, orgData] = await Promise.all([
    fetchHomepage(),
    fetchOrganizationData()
  ])

  const serviceTitles = (data.homepage?.capabilities ?? [])
    .map((c) => c.title)
    .filter((title): title is string => Boolean(title))

  return (
    <div className="flex flex-col gap-18 lg:gap-32">
      <JsonLd data={generateWebSiteSchema()} />
      <JsonLd
        data={generateProfessionalServiceSchema({
          services: serviceTitles,
          email: orgData.email
        })}
      />
      <Intro data={data} />
      <Brands data={data} />
      <FeaturedProjects data={data} />
      <Capabilities data={data} />
      <AboutEntity />
      <Contact />
    </div>
  )
}

export default Homepage
