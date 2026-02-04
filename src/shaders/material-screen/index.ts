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
  step,
  abs,
  clamp,
  mod,
  mix,
  min,
  round,
  positionLocal,
  screenCoordinate
} from "three/tsl"
import type { NodeRepresentation } from "three/tsl"
import { FrontSide, Texture } from "three"
import { NodeMaterial } from "three/webgpu"

const DISTORTION = 0.3
const TINT_R = 1.33
const TINT_G = 0.11
const BRIGHTNESS = 15.0
const VIGNETTE_STRENGTH = 0.1
const LINE_HEIGHT = 0.1
const INTERFERENCE1 = 0.4
const INTERFERENCE2 = 0.001
const SCANLINE_INTENSITY = 0.2
const SCANLINE_COUNT = 200.0
const NOISE_SCALE = 500.0
const NOISE_OPACITY = 0.01
const SCAN_SPEED = 5.0
const SCAN_CYCLE = 10.0
const SCAN_DISTORTION = 0.003

const random = /* @__PURE__ */ Fn(([st]: [NodeRepresentation]) => {
  return fract(sin(dot(st, vec2(12.9898, 78.233))).mul(43758.5453123))
})

const curveRemapUV = /* @__PURE__ */ Fn(([uvIn]: [NodeRepresentation]) => {
  const u = vec2(uvIn).toVar()
  u.assign(u.mul(2.0).sub(1.0))
  const offset = abs(vec2(u.y, u.x)).div(5.0)
  u.assign(u.add(u.mul(offset).mul(offset).mul(DISTORTION)))
  u.assign(u.mul(0.5).add(0.5))
  return u
})

const peak = /* @__PURE__ */ Fn(
  ([x, xpos, scale]: [
    NodeRepresentation,
    NodeRepresentation,
    NodeRepresentation
  ]) => {
    const xf = float(x)
    const xposf = float(xpos)
    const scalef = float(scale)
    const d = abs(xf.sub(xposf))
    const approxLog = mix(float(6.0), d.mul(-4.605).add(2.0), step(0.001, d))
    return clamp(float(1.0).sub(xf).mul(scalef).mul(approxLog), 0.0, 1.0)
  }
)

export const createScreenMaterial = () => {
  const mapTex = texture(new Texture())
  const uTime = uniform(0)
  const uRevealProgress = uniform(1.0)
  const uFlip = uniform(0)
  const uIsGameRunning = uniform(0.0)

  const material = new NodeMaterial()
  material.side = FrontSide

  material.colorNode = Fn(() => {
    const vUv = uv()
    const vPos = positionLocal

    // Scan cycle
    const scanCycleTime = mod(uTime.mul(SCAN_SPEED), float(SCAN_CYCLE + 50.0))
    const scanPos = mix(
      scanCycleTime.div(SCAN_CYCLE),
      float(1.0),
      step(SCAN_CYCLE, scanCycleTime)
    )

    // Interference
    const scany = round(vUv.y.mul(1024.0))
    const r = random(
      vec2(uTime.mul(0.001), scany.add(uTime.mul(0.001)))
    ).toVar()
    r.assign(mix(r, r.mul(3.0), step(0.995, r)))

    const ifx1 = float(INTERFERENCE1).mul(2.0).div(1024.0).mul(r)
    const ifx2 = float(INTERFERENCE2).mul(
      r.mul(peak(vUv.y, float(0.2), float(0.2)))
    )

    const interferenceUv = vUv.toVar()
    interferenceUv.x.addAssign(ifx1.sub(ifx2))

    // CRT curve remap
    const remappedUv = curveRemapUV(interferenceUv).toVar()

    // Flip y when uFlip is 1
    remappedUv.y.assign(
      mix(remappedUv.y, float(1.0).sub(remappedUv.y), uFlip)
    )

    // Pixelation with exclusion zones (only when flipped)
    const centeredUv = remappedUv.sub(0.5)

    const relSquare = abs(centeredUv.sub(vec2(-0.01, -0.4)))
    const inSquare = float(1.0)
      .sub(step(0.25, relSquare.x))
      .mul(float(1.0).sub(step(0.05, relSquare.y)))

    const relCenter = abs(centeredUv.sub(vec2(-0.35, 0.5)))
    const inCenterSquare = float(1.0)
      .sub(step(0.2, relCenter.x))
      .mul(float(1.0).sub(step(0.2, relCenter.y)))

    const notInCenter = float(1.0).sub(inCenterSquare)
    const notInSquare = float(1.0).sub(inSquare)
    const gameRunning = step(0.5, uIsGameRunning)

    // shouldPixelate = uFlip AND !center AND (gameRunning OR !square)
    const shouldPixelate = uFlip
      .mul(notInCenter)
      .mul(gameRunning.add(notInSquare).sub(gameRunning.mul(notInSquare)))

    const pixelatedUv = floor(remappedUv.mul(300.0)).div(300.0)
    remappedUv.assign(mix(remappedUv, pixelatedUv, shouldPixelate))

    // Scan distortion
    const yd = vUv.y.sub(scanPos).mul(160.0)
    const yd2 = yd.mul(yd)
    const yd4 = yd2.mul(yd2)
    const expApprox = float(1.0).div(
      float(1.0).add(yd2.mul(0.5)).add(yd4.mul(0.125))
    )
    remappedUv.x.addAssign(expApprox.mul(SCAN_DISTORTION))

    // Texture sampling with boundary check
    const validX = step(0.0, remappedUv.x).mul(
      step(0.0, float(1.0).sub(remappedUv.x))
    )
    const validY = step(0.0, remappedUv.y).mul(
      step(0.0, float(1.0).sub(remappedUv.y))
    )
    const validUV = validX.mul(validY)

    const textureColor = mapTex.uv(remappedUv).rgb.mul(validUV).toVar()

    // Color grading: luma, tint, brightness
    const luma = dot(textureColor, vec3(0.8, 0.1, 0.1))
    const tint = vec3(1.0 * TINT_R, 0.302 * TINT_G, 0.0)
    textureColor.assign(tint.mul(luma).mul(BRIGHTNESS))

    // Line reveal
    const currentLine = floor(vUv.y.div(LINE_HEIGHT))
    const revealLine = floor(uRevealProgress.div(LINE_HEIGHT))
    const textureVisibility = step(currentLine, revealLine).mul(0.8)

    const color = textureColor.mul(textureVisibility).toVar()

    // Vignette
    const vignetteUv = vUv.mul(2.0).sub(1.0)
    const vignette = float(1.0).sub(
      min(float(1.0), dot(vignetteUv, vignetteUv).mul(VIGNETTE_STRENGTH))
    )
    color.assign(color.mul(vignette))

    // Noise overlay
    const noiseUv = screenCoordinate.xy.div(NOISE_SCALE)
    const noise = random(noiseUv.add(uTime))
    color.assign(color.add(noise.mul(NOISE_OPACITY)))

    // Orange tint on dark areas
    const orangeTint = vec3(0.2, 0.05, 0.0)
    const luminance = dot(color, vec3(0.299, 0.587, 0.114))
    const isNotBlack = step(0.01, luminance)
    color.assign(mix(color.add(orangeTint.mul(0.1)), color, isNotBlack))

    // Scanlines
    const scanline = step(0.5, fract(vPos.y.mul(SCANLINE_COUNT)))
    const scanlineFactor = mix(
      float(1.0),
      float(0.7),
      scanline.mul(SCANLINE_INTENSITY)
    )
    color.assign(
      mix(
        color,
        color
          .mul(scanlineFactor)
          .add(vec3(0.1, 0.025, 0.0).mul(float(1.0).sub(scanlineFactor))),
        0.5
      )
    )

    return vec4(color, 1.0)
  })()

  return {
    material,
    uniforms: { map: mapTex, uTime, uRevealProgress, uFlip, uIsGameRunning }
  }
}
