import { Pump } from "basehub/react-pump"
import type { Metadata } from "next"

import { Crew } from "./crew"
import { Hero } from "./hero"
import { OpenPositions } from "./open-positions"
import { careersQuery } from "./query"
import { Values } from "./values"

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
          <OpenPositions data={data} />
        </>
      )
    }}
  </Pump>
)

export default About
