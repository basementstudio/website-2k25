import { Pump } from "basehub/react-pump"

import { Grid } from "@/components/grid"

import { Awards } from "./awards"
import { Clients } from "./clients"
import { Hero } from "./hero"
import { People } from "./people"
import { query } from "./query"
import { Services } from "./services"

const About = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <main className="relative -mt-24 flex flex-col gap-61 bg-brand-k pb-25 pt-3 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
          <Grid />
          <Hero data={data} className="-mb-11" />
          <Services data={data} />
          <Clients data={data} />
          <People data={data} />
          <Awards data={data} />
        </main>
      )
    }}
  </Pump>
)

export default About
