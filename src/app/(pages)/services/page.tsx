import { Pump } from "basehub/react-pump"
import type { Metadata } from "next"

import { Contact } from "@/components/layout/contact"

import { Awards } from "./awards"
import { Hero } from "./hero"
import { query } from "./query"
import { Services } from "./services"
import { Testimonials } from "./testimonials"
import { VenturesBanner } from "./ventures"

export const metadata: Metadata = {
  title: "Services",
  description: "Our services"
}

const ServicesPage = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <div className="flex flex-col gap-18 lg:gap-44">
          <Hero data={data} className="lg:-mb-11" />
          <Services data={data} />
          <Testimonials data={data} />
          <Awards data={data} />
          <VenturesBanner data={data} />
          <Contact />
        </div>
      )
    }}
  </Pump>
)

export default ServicesPage
