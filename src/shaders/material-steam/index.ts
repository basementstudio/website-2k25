import {
  Fn,
  float,
  vec2,
  vec3,
  uniform,
  uv,
  texture,
  smoothstep,
  mod,
  floor,
  clamp,
  sin,
  cos,
  pow,
  positionLocal,
  screenCoordinate
} from "three/tsl"
import { DoubleSide, Texture } from "three"
import { NodeMaterial } from "three/webgpu"

export const createSteamMaterial = () => {
  const uTime = uniform(0)
  const uNoiseTex = texture(new Texture())

  const material = new NodeMaterial()
  material.transparent = true
  material.side = DoubleSide

  // Vertex: noise-based offset + twist
  material.positionNode = Fn(() => {
    const vUv = uv()
    const pos = positionLocal.toVar()

    // Noise-based offset
    const noiseUv1 = vec2(float(0.25), uTime.mul(0.005))
    const noiseVal = uNoiseTex.sample(noiseUv1).r
    const offsetAmount = noiseVal.mul(pow(vUv.y, float(1.2))).mul(0.035)

    pos.x.addAssign(offsetAmount)
    pos.z.addAssign(offsetAmount)

    // Noise-based twist
    const noiseUv2 = vec2(float(0.5), vUv.y.mul(0.2).sub(uTime.mul(0.005)))
    const twist = uNoiseTex.sample(noiseUv2).r
    const angle = twist.mul(8.0)
    const s = sin(angle)
    const c = cos(angle)

    const oldX = pos.x.toVar()
    const oldZ = pos.z.toVar()
    pos.x.assign(oldX.mul(c).sub(oldZ.mul(s)))
    pos.z.assign(oldX.mul(s).add(oldZ.mul(c)))

    return pos
  })()

  // Fragment: constant color
  material.colorNode = vec3(0.92, 0.78, 0.62)

  // Fragment: steam alpha with edge fades, checkerboard, gradient
  material.opacityNode = Fn(() => {
    const vUv = uv()

    // Steam from noise
    const steamUv = vec2(vUv.x.mul(0.5), vUv.y.mul(0.3).sub(uTime.mul(0.015)))
    const steam = smoothstep(float(0.45), float(1.0), uNoiseTex.sample(steamUv).r)

    // Edge fades
    const edgeFadeX = smoothstep(float(0.0), float(0.15), vUv.x)
      .mul(float(1.0).sub(smoothstep(float(0.85), float(1.0), vUv.x)))
    const edgeFadeY = smoothstep(float(0.0), float(0.15), vUv.y)
      .mul(float(1.0).sub(smoothstep(float(0.85), float(1.0), vUv.y)))

    const fadedSteam = steam.mul(edgeFadeX).mul(edgeFadeY)

    // Checkerboard pattern from screen coordinates
    const pattern = mod(
      floor(screenCoordinate.x.mul(0.5)).add(floor(screenCoordinate.y.mul(0.5))),
      float(2.0)
    )

    // Gradient
    const gradient = clamp(
      float(1.2).sub(float(1.25).mul(vUv.y)),
      0.0,
      1.0
    )

    const alpha = fadedSteam.mul(pattern).mul(gradient)

    // Discard near-zero alpha fragments
    alpha.lessThan(0.001).discard()

    return alpha
  })()

  return { material, uniforms: { uTime, uNoise: uNoiseTex } }
}
