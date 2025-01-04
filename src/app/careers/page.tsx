import { Pump } from "basehub/react-pump"

import { careersQuery } from "./careers-query"
import { Hero } from "./hero"
import { OpenPositions } from "./open-positions"
import { Values } from "./values"

const About = () => (
  <Pump queries={[careersQuery]}>
    {async ([data]) => {
      "use server"

      return (
        <main className="relative -mt-24 bg-brand-k pt-3 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
          <Hero data={data} />
          <Values data={data} />
          <OpenPositions data={data} />
        </main>
      )
    }}
  </Pump>
)

export default About
