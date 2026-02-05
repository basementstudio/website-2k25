import { Texture, Vector2 } from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Fn,
  float,
  vec2,
  vec3,
  vec4,
  uniform,
  screenUV,
  texture,
  screenCoordinate,
  sin,
  cos,
  dot,
  fract,
  floor,
  mod,
  smoothstep,
  step,
  mix,
  clamp,
  max,
  pow,
  sqrt,
  length,
  select,
  Loop,
  int
} from "three/tsl"

const SAMPLE_COUNT = 16
const GOLDEN_ANGLE = 2.399963229728653
const PI_2 = 6.28318530718

export const createPostProcessingMaterial = () => {
  const mainTexPlaceholder = new Texture()
  mainTexPlaceholder.isRenderTargetTexture = true
  const uMainTexture = texture(mainTexPlaceholder)
  const uDepthTexture = texture(new Texture())
  const uResolution = uniform(new Vector2(1, 1))
  const uPixelRatio = uniform(1)
  const uOpacity = uniform(1)
  const uActiveBloom = uniform(1)
  const uContrast = uniform(1)
  const uBrightness = uniform(1)
  const uExposure = uniform(1)
  const uGamma = uniform(1)
  const uVignetteRadius = uniform(0.9)
  const uVignetteSpread = uniform(0.5)
  const uBloomStrength = uniform(1)
  const uBloomRadius = uniform(1)
  const uBloomThreshold = uniform(1)

  const material = new NodeMaterial()
  material.transparent = true

  // --- Helper Fns ---

  const hashFn = /* @__PURE__ */ Fn(([p]: [any]) => {
    const hp = fract(p.mul(vec2(123.34, 456.21))).toVar()
    hp.addAssign(dot(hp, hp.add(456.21)))
    return fract(hp.x.mul(hp.y))
  })

  const vogelDiskSampleFn = /* @__PURE__ */ Fn(
    ([sampleIndex, samplesCount, phi]: [any, any, any]) => {
      const invSamplesCount = float(1.0).div(sqrt(float(samplesCount)))
      const r = sqrt(float(sampleIndex).add(0.5)).mul(invSamplesCount)
      const theta = float(sampleIndex).mul(GOLDEN_ANGLE).add(phi)
      return vec2(r.mul(cos(theta)), r.mul(sin(theta)))
    }
  )

  const contrastFn = /* @__PURE__ */ Fn(([color, c]: [any, any]) => {
    return color.sub(0.5).mul(c).add(0.5)
  })

  const RRTAndODTFitFn = /* @__PURE__ */ Fn(([v]: [any]) => {
    const v2 = v.mul(v)
    const a = v.mul(0.0245786).add(v2).add(-0.000090537)
    const b = v.mul(0.432951).add(v2.mul(0.983729)).add(0.238081)
    return a.div(b)
  })

  const ACESFilmicFn = /* @__PURE__ */ Fn(([color]: [any]) => {
    const c = color.mul(uExposure).mul(1.0 / 0.6).toVar()

    // ACESInputMat * color
    const ct = vec3(
      float(0.59719).mul(c.r).add(float(0.35458).mul(c.g)).add(float(0.04823).mul(c.b)),
      float(0.076).mul(c.r).add(float(0.90834).mul(c.g)).add(float(0.01566).mul(c.b)),
      float(0.0284).mul(c.r).add(float(0.13383).mul(c.g)).add(float(0.83777).mul(c.b))
    ).toVar()

    ct.assign(RRTAndODTFitFn(ct))

    // ACESOutputMat * colorTransformed
    return clamp(
      vec3(
        float(1.60475).mul(ct.r).add(float(-0.53108).mul(ct.g)).add(float(-0.07367).mul(ct.b)),
        float(-0.10208).mul(ct.r).add(float(1.10813).mul(ct.g)).add(float(-0.00605).mul(ct.b)),
        float(-0.00327).mul(ct.r).add(float(-0.07276).mul(ct.g)).add(float(1.07602).mul(ct.b))
      ),
      0.0,
      1.0
    )
  })

  const tonemapFn = /* @__PURE__ */ Fn(([color]: [any]) => {
    const c = color.mul(uBrightness).toVar()
    c.assign(contrastFn(c, uContrast))
    c.assign(pow(c, vec3(uGamma))) // inverted gamma
    c.assign(ACESFilmicFn(c))
    return c
  })

  const getVignetteFactorFn = /* @__PURE__ */ Fn(([uvCoord]: [any]) => {
    const center = vec2(0.5, 0.5)
    return float(1.0).sub(
      smoothstep(
        uVignetteRadius,
        uVignetteRadius.sub(uVignetteSpread),
        length(uvCoord.sub(center))
      )
    )
  })

  // --- Main post-processing computation ---

  const LUMINANCE_FACTORS = vec3(0.2126, 0.7152, 0.0722)

  const postProcessResult = Fn(() => {
    const vUv = screenUV

    // Checker pattern using screen coordinates
    const checkerSize = float(2.0).mul(uPixelRatio)
    const checkerPos = floor(screenCoordinate.xy.div(checkerSize))
    const checkerPattern = mod(checkerPos.x.add(checkerPos.y), 2.0)

    // Resolution helpers
    const halfResolution = uResolution.div(2.0)
    const eighthResolution = uResolution.div(8.0)
    const invResolution = vec2(1.0, 1.0).div(uResolution)

    // Pixelated UVs
    const pixelatedUv = floor(vUv.mul(halfResolution)).mul(2.0).div(uResolution)
    const pixelatedUvEighth = floor(vUv.mul(eighthResolution)).mul(8.0).div(uResolution)

    // Main texture sample + tonemap
    const baseColorSample = uMainTexture.sample(vUv)
    const color = tonemapFn(baseColorSample.rgb).toVar()

    // Alpha / reveal logic (branchless)
    const opacityOk = float(step(float(0.001), uOpacity)) // 1 when opacity >= 0.001
    const reveal = clamp(float(1.0).sub(uOpacity), 0.0, 1.0)
    const revealPow = reveal.mul(reveal).mul(reveal).mul(reveal)
    const basePixelatedSample = uMainTexture.sample(pixelatedUvEighth)
    const baseBrightness = dot(tonemapFn(basePixelatedSample.rgb), LUMINANCE_FACTORS)
    // revealHides = 1 when reveal is active AND brightness < reveal threshold
    const revealHides = float(step(float(0.001), revealPow)).mul(
      float(1.0).sub(float(step(revealPow, baseBrightness)))
    )
    const alpha = opacityOk.mul(float(1.0).sub(revealHides))

    // Bloom (Vogel disk sampling)
    const bloomActive = float(step(float(0.001), uBloomStrength))
      .mul(float(step(float(0.5), checkerPattern)))
      .mul(float(step(float(0.5), uActiveBloom)))

    const bloom = vec3(0.0, 0.0, 0.0).toVar()
    const totalWeight = float(0.0).toVar()
    const phi = hashFn(pixelatedUv).mul(PI_2)
    const bloomRadiusScaled = uBloomRadius.mul(invResolution)

    Loop(SAMPLE_COUNT - 1, ({ i }: { i: any }) => {
      const idx = i.add(1)
      const sampleOffset = vogelDiskSampleFn(
        idx,
        int(SAMPLE_COUNT),
        phi
      ).mul(bloomRadiusScaled)
      const dist = length(sampleOffset)

      const weight = select(
        dist.greaterThan(0.001),
        float(1.0).div(dist),
        float(1000.0)
      )

      const sampleColor = uMainTexture
        .sample(pixelatedUv.add(sampleOffset).add(invResolution))
        .rgb
      const brightness = dot(sampleColor, LUMINANCE_FACTORS)
      const shouldAdd = float(step(uBloomThreshold, brightness))

      totalWeight.addAssign(weight)
      bloom.addAssign(sampleColor.mul(weight).mul(shouldAdd))
    })

    const safeWeight = max(totalWeight, float(0.0001))
    color.addAssign(bloom.div(safeWeight).mul(uBloomStrength).mul(bloomActive))
    color.assign(clamp(color, 0.0, 1.0))

    // Vignette
    const vignetteFactor = getVignetteFactorFn(vUv)
    color.assign(mix(color, vec3(0.0, 0.0, 0.0), vignetteFactor))

    return vec4(color, alpha)
  })()

  material.colorNode = postProcessResult.rgb
  material.opacityNode = postProcessResult.a

  return {
    material,
    uniforms: {
      uMainTexture,
      uDepthTexture,
      resolution: uResolution,
      uPixelRatio,
      uOpacity,
      uActiveBloom,
      uContrast,
      uBrightness,
      uExposure,
      uGamma,
      uVignetteRadius,
      uVignetteSpread,
      uBloomStrength,
      uBloomRadius,
      uBloomThreshold
    }
  }
}
