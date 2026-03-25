import { Pump } from "basehub/react-pump"
import type { Metadata } from "next"

import { Contact } from "@/components/layout/contact"
import { JsonLd } from "@/lib/structured-data/json-ld"
import {
  generateProfessionalServiceSchema,
  generateReviewSchemas
} from "@/lib/structured-data/schemas/professional-service"

import { Awards } from "./awards"
import { Hero } from "./hero"
import { query, QueryType } from "./query"
import { Services } from "./services"
import { Testimonials } from "./testimonials"
import { VenturesBanner } from "./ventures"

export const metadata: Metadata = {
  title: "Services",
  alternates: {
    canonical: "https://basement.studio/services"
  }
}

export type Award = QueryType["company"]["awards"]["awardList"]["items"][number]

const getSortedAwards = (awards: Award[]) => {
  return awards
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((award, index) => ({
      ...award,
      numericId: index + 1
    }))
}

const ServicesPage = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      const serviceSchema = generateProfessionalServiceSchema(
        data.company.services.serviceCategories.items
      )
      const reviewSchemas = generateReviewSchemas(
        data.company.testimonials.services
      )

      return (
        <>
          <JsonLd data={serviceSchema} />
          {reviewSchemas.map((review, i) =>
            review ? <JsonLd key={i} data={review} /> : null
          )}
          <div className="flex flex-col gap-18 lg:gap-44">
            <Hero data={data} className="lg:-mb-11" />
            <Services data={data} />
            <Testimonials data={data} />
            <Awards data={getSortedAwards(data.company.awards.awardList.items)} />
            <VenturesBanner data={data} />
            <Contact />
          </div>
        </>
      )
    }}
  </Pump>
)

export default ServicesPage
