import { Pump } from "basehub/react-pump"

import { careersQuery } from "./query"
import { Hero } from "./hero"

const About = () => (
  <Pump queries={[careersQuery]}>
    {async ([data]) => {
      "use server"

      return (
        <main className="relative -mt-24 flex flex-col gap-61 bg-brand-k pb-25 pt-3 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
          <Hero />
        </main>
      )
    }}
  </Pump>
)

export default About
