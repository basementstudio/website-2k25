import { query } from "@/components/arcade-screen/query"

import { Pump } from "../../../.basehub/react-pump"
import { ArcadeDataHandler } from "./arcade-handler"

const Arcade = () => {
  return (
    <Pump queries={[query]}>
      {async ([data]) => {
        "use server"
        return <ArcadeDataHandler data={data} />
      }}
    </Pump>
  )
}

export default Arcade
