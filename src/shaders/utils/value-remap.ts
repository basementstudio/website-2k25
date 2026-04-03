import { add, div, Fn, mul, sub } from "three/tsl"
import type { NodeRepresentation } from "three/tsl"

export const valueRemap = /* @__PURE__ */ Fn(
  ([value, inMin, inMax, outMin, outMax]: [
    NodeRepresentation,
    NodeRepresentation,
    NodeRepresentation,
    NodeRepresentation,
    NodeRepresentation
  ]) => {
    return add(outMin, mul(div(sub(value, inMin), sub(inMax, inMin)), sub(outMax, outMin)))
  }
)

export const valueRemapNormalized = /* @__PURE__ */ Fn(
  ([value, inMin, inMax]: [
    NodeRepresentation,
    NodeRepresentation,
    NodeRepresentation
  ]) => {
    return div(sub(value, inMin), sub(inMax, inMin))
  }
)
