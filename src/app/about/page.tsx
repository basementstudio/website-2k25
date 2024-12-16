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
        <main className="relative -mt-24 bg-brand-k pt-2 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
          <Grid />
          <div className="relative flex flex-col gap-49">
            <Hero data={data} />
            <Services data={data} />
            <Clients data={data} />
            <People data={data} />
            <Awards data={data} />
          </div>
        </main>
      )
    }}
  </Pump>
)

export default About
