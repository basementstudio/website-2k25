import { Pump } from "basehub/react-pump"

import { Contact } from "@/components/layout/contact"

import { Brands } from "./brands"
import { Capabilities } from "./capabilities"
import { FeaturedProjects } from "./featured-projects"
import { Intro } from "./intro"
import { query } from "./query"

const Homepage = () => {
  return (
    <Pump queries={[query]}>
      {async ([data]) => {
        "use server"

        return (
          <div className="flex flex-col gap-44">
            <Intro data={data} />
            <Brands data={data} />
            <FeaturedProjects data={data} />
            <Capabilities data={data} />
            <Contact />
          </div>
        )
      }}
    </Pump>
  )
}

export default Homepage
