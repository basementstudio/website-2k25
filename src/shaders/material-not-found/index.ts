import {
  Fn,
  float,
  vec2,
  vec3,
  vec4,
  uniform,
  uv,
  texture,
  sin,
  dot,
  fract,
  floor,
  step
} from "three/tsl"
import type { NodeRepresentation } from "three/tsl"
import { FrontSide, Texture, Vector2 } from "three"
import { NodeMaterial } from "three/webgpu"

const random = /* @__PURE__ */ Fn(([st]: [NodeRepresentation]) => {
  return fract(sin(dot(st, vec2(12.9898, 78.233))).mul(43758.5453))
})

const shakeOffset = /* @__PURE__ */ Fn(
  ([time, intensity]: [NodeRepresentation, NodeRepresentation]) => {
    const t = float(time)
    const i = float(intensity)
    const t03 = t.mul(0.3)
    const t02 = t.mul(0.2)
    const shakeX = random(vec2(t03, t03)).mul(2.0).sub(1.0)
    const shakeY = random(vec2(t02, t02)).mul(2.0).sub(1.0)
    const t05 = floor(t.mul(0.5))
    const shakeBurst = float(step(0.58, random(vec2(t05, t05))))
    return vec2(shakeX, shakeY).mul(i).mul(shakeBurst)
  }
)

export const createNotFoundMaterial = () => {
  const tDiffuse = texture(new Texture())
  const uTime = uniform(0)
  const resolution = uniform(new Vector2(1024, 1024))

  const material = new NodeMaterial()
  material.side = FrontSide

  material.colorNode = Fn(() => {
    const vUv = uv()

    // Shake offset
    const shake = shakeOffset(uTime, float(0.0005))
    const uv2 = vUv.add(shake).toVar()
    uv2.x.assign(float(1.0).sub(uv2.x))
    uv2.subAssign(0.5)

    // 180° rotation (cosR=-1, sinR=0) + re-center
    const shiftedUv = uv2.mul(-1.0).add(0.5)

    // Texture sampling with color bleeding
    const baseColor = tDiffuse.sample(shiftedUv)
    const colorBleedUp = tDiffuse.sample(shiftedUv.add(vec2(0.0, 0.001)))
    const colorBleedDown = tDiffuse.sample(shiftedUv.sub(vec2(0.0, 0.001)))
    const colorWithBleed = baseColor.add(
      colorBleedUp.add(colorBleedDown).mul(0.5)
    )

    // Scanlines: color.rgb *= (1 + scanline * 0.35)
    const scanline = sin(
      vUv.y.mul(resolution.y).mul(0.45).sub(uTime.mul(15.0))
    )
    const afterScanline = colorWithBleed.rgb.mul(
      float(1.0).add(scanline.mul(0.35))
    )

    // Noise
    const noise = random(vUv.add(uTime.mul(5.0)))
    const afterNoise = afterScanline.add(noise.mul(0.15))

    // Subtle wave
    const wave = sin(vUv.y.mul(10.0).add(uTime.mul(10.0))).mul(0.02)
    const afterWave = afterNoise.add(wave)

    // Grayscale + tint
    const grayscale = dot(afterWave, vec3(0.299, 0.587, 0.114))
    const tint = vec3(2.694, 2.694, 2.694)

    return vec4(vec3(grayscale, grayscale, grayscale).mul(tint), colorWithBleed.a)
  })()

  return { material, uniforms: { tDiffuse, uTime, resolution } }
}
