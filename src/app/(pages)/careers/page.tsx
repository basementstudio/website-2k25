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
        <>
          <Hero data={data} />
          <Values data={data} />
          <OpenPositions data={data} />
        </>
      )
    }}
  </Pump>
)

export default About
