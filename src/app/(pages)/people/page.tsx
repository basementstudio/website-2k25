import { Pump } from "basehub/react-pump"
import type { Metadata } from "next"

import { Contact } from "@/components/layout/contact"

import { Crew } from "./crew"
import { Hero } from "./hero"
import { OpenPositions } from "./open-positions"
import { careersQuery } from "./query"
import { Values } from "./values"
import { PreOpenPositions } from "./pre-open-positions"

export const metadata: Metadata = {
  title: "People",
  description: "Our people"
}

const About = () => (
  <Pump queries={[careersQuery]}>
    {async ([data]) => {
      "use server"

      return (
        <>
          <Hero data={data} />
          <Values data={data} />
          <Crew data={data} />
          <PreOpenPositions data={data} />
          <OpenPositions data={data} />
          <Contact />
        </>
      )
    }}
  </Pump>
)

export default About
