import { Pump } from "basehub/react-pump"

import { careersQuery } from "./careers-query"
import { Hero } from "./hero"
import { Values } from "./values"
import { OpenPositions } from "./open-positions"

const About = () => (
  <Pump queries={[careersQuery]}>
    {async ([data]) => {
      "use server"

      return (
        <main className="relative -mt-24 flex flex-col gap-61 bg-brand-k pb-25 pt-3 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
          <Hero />
          <Values data={data} />
          <OpenPositions data={data} />
        </main>
      )
    }}
  </Pump>
)

export default About
