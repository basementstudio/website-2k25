import { Contact } from "@/components/layout/contact"

import { fetchHomepage } from "./basehub"
import { Brands } from "./brands"
import { BrandsMobile } from "./brands-mobile"
import { Capabilities } from "./capabilities"
import { FeaturedProjects } from "./featured-projects"
import { Intro } from "./intro"

const Homepage = async () => {
  const data = await fetchHomepage()

  return (
    <div className="flex flex-col gap-18 lg:gap-44">
      <Intro data={data} />
      <Brands data={data} />
      <BrandsMobile />
      <FeaturedProjects data={data} />
      <Capabilities data={data} />
      <Contact />
    </div>
  )
}

export default Homepage
