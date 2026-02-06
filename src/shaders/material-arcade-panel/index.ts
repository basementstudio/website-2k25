import { Color, Vector2 } from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Fn,
  float,
  vec2,
  vec4,
  uniform,
  uv,
  abs,
  max,
  min,
  mix,
  smoothstep
} from "three/tsl"

export const createPanelMaterial = ({
  bgColor = new Color(0, 0, 0),
  borderColor = new Color(1, 0.3, 0),
  borderWidth = 0,
  radius = 0,
  size = new Vector2(1, 1),
  opacity = 1
} = {}) => {
  const uBgColor = uniform(bgColor)
  const uBorderColor = uniform(borderColor)
  const uBorderWidth = uniform(borderWidth)
  const uRadius = uniform(radius)
  const uSize = uniform(size)
  const uOpacity = uniform(opacity)

  const material = new NodeMaterial()
  material.transparent = true
  material.depthWrite = false

  // Rounded rectangle SDF in UV space
  const roundedRectSDF = /* @__PURE__ */ Fn(
    ([p, halfSize, r]: [any, any, any]) => {
      const rVec = vec2(r, r)
      const q = abs(p).sub(halfSize).add(rVec)
      const outerDist = max(q, vec2(0.0, 0.0))
      const outerLen = outerDist.length()
      const innerDist = min(max(q.x, q.y), float(0.0))
      return outerLen.add(innerDist).sub(r)
    }
  )

  material.colorNode = Fn(() => {
    const vUv = uv()

    // Center UV to [-0.5, 0.5]
    const p = vUv.sub(0.5)

    // Convert radius and borderWidth from virtual units to UV space
    const radiusUv = vec2(uRadius.div(uSize.x), uRadius.div(uSize.y))
    const r = min(radiusUv.x, radiusUv.y)

    const borderUv = vec2(uBorderWidth.div(uSize.x), uBorderWidth.div(uSize.y))

    const halfSize = vec2(0.5, 0.5)

    // SDF distance (negative inside, positive outside)
    const d = roundedRectSDF(p, halfSize, r)

    // Anti-aliased edge: ~1 pixel smooth width in UV space (adaptive to panel size)
    const edgeSmooth = float(1.0).div(max(uSize.x, uSize.y))
    const outerAlpha = float(1.0).sub(smoothstep(float(0.0), edgeSmooth, d))

    // Discard fully outside
    outerAlpha.lessThan(0.001).discard()

    // Border region: inside the shape but within borderWidth of edge
    const borderSdf = roundedRectSDF(
      p,
      halfSize.sub(borderUv),
      max(r.sub(min(borderUv.x, borderUv.y)), float(0.0))
    )
    // borderMask: 1 deep inside (bg), 0 at border edge
    const borderMask = float(1.0).sub(
      smoothstep(edgeSmooth.negate(), edgeSmooth, borderSdf)
    )

    // Mix background and border colors
    // Use standalone mix() — the .mix() method on nodes swaps arguments
    const hasBorder = smoothstep(float(0.0), float(0.001), uBorderWidth)
    const t = hasBorder.mul(float(1.0).sub(borderMask))
    const finalColor = mix(uBgColor, uBorderColor, t)

    return vec4(finalColor, outerAlpha.mul(uOpacity))
  })()

  return {
    material,
    uniforms: {
      uBgColor,
      uBorderColor,
      uBorderWidth,
      uRadius,
      uSize,
      uOpacity
    }
  }
}
