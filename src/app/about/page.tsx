import { Pump } from "basehub/react-pump"

import { Grid } from "@/components/grid"

import { Awards } from "./awards"
import { Clients } from "./clients"
import { Hero } from "./hero"
import { People } from "./people"
import { query } from "./query"
import { Services } from "./services"

const About = () => (
  <Pump queries={[query]} next={{ revalidate: 30 }}>
    {async ([data]) => {
      "use server"

      if (!data) return null

      return (
        <main className="relative -mt-24 bg-brand-k pt-2">
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
