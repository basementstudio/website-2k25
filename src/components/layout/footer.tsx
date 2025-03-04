import { Pump } from "basehub/react-pump"

import { FooterContent } from "./footer-content"
import { query } from "./query"

export const Footer = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return <FooterContent data={data} />
    }}
  </Pump>
)
