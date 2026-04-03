import { add, clamp, dot, float, Fn, mul, normalize, pow } from "three/tsl"
import type { NodeRepresentation } from "three/tsl"

import { valueRemap } from "./value-remap"

export const basicLight = /* @__PURE__ */ Fn(
  ([normal, lightDir, intensity]: [
    NodeRepresentation,
    NodeRepresentation,
    NodeRepresentation
  ]) => {
    const lightFactor = dot(lightDir, normalize(normal))
    const remapped = valueRemap(lightFactor, float(0.2), float(1.0), float(0.1), float(1.0))
    const clamped = clamp(remapped, 0.0, 1.0)
    const powered = pow(clamped, float(2.0))
    return add(mul(powered, intensity), float(1.0))
  }
)
