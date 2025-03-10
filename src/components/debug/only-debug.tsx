// this module will be dynamically imported only on debug

import { Perf } from "r3f-perf"

import { WebGlTunnelIn } from "../tunnel"
import { ReactScan } from "./react-scan"

export function OnlyDebug() {
  return (
    <>
      <ReactScan />
      <WebGlTunnelIn>
        <Perf
          style={{
            position: "absolute",
            top: 40,
            right: 0,
            zIndex: 1000
          }}
        />
      </WebGlTunnelIn>
    </>
  )
}
