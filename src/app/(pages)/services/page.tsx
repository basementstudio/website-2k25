import { Pump } from "basehub/react-pump"

import { Awards } from "./awards"
import { Clients } from "./clients"
import { Hero } from "./hero"
import { query } from "./query"
import { Services } from "./services"
import { VenturesBanner } from "./ventures"

const ServicesPage = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <div className="flex flex-col gap-61">
          <Hero data={data} className="-mb-11" />
          <Services data={data} />
          <Clients data={data} />
          <VenturesBanner data={data} />
          <Awards data={data} />
        </div>
      )
    }}
  </Pump>
)

export default ServicesPage
