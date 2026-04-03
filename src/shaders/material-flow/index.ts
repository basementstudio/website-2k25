import { Texture, Vector2 } from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Fn,
  float,
  vec2,
  vec3,
  vec4,
  uniform,
  uv,
  texture,
  step,
  mix,
  length,
  fract,
  dot
} from "three/tsl"

const FLOW_RESOLUTION = 256

export const createFlowMaterial = () => {
  const uFrame = uniform(0)
  const uFeedbackTexture = texture(new Texture())
  const uMousePosition = uniform(new Vector2(10, 10))
  const uMouseMoving = uniform(0)
  const uMouseDepth = uniform(0)

  const material = new NodeMaterial()

  // Fast hash-based 3D noise (replaces expensive mx_noise_float)
  const hashNoise3d = /* @__PURE__ */ Fn(([p]: [any]) => {
    const p3 = fract(p.mul(vec3(0.1031, 0.1030, 0.0973))).toVar()
    p3.addAssign(dot(p3, vec3(p3.y, p3.z, p3.x).add(33.33)))
    return fract(p3.x.add(p3.y).mul(p3.z)).mul(2.0).sub(1.0)
  })

  const invRes = vec2(1.0 / FLOW_RESOLUTION, 1.0 / FLOW_RESOLUTION)

  // samplePrev: sample center + 4 neighbors, find smallest growth
  const samplePrevFn = /* @__PURE__ */ Fn(([uvCoord]: [any]) => {
    const pixel = uvCoord.mul(FLOW_RESOLUTION)

    const p00 = uFeedbackTexture.sample(uvCoord)
    const p10 = uFeedbackTexture.sample(
      uvCoord.add(vec2(0.0, -1.0).mul(invRes))
    )
    const p01 = uFeedbackTexture.sample(
      uvCoord.add(vec2(-1.0, 0.0).mul(invRes))
    )
    const p21 = uFeedbackTexture.sample(
      uvCoord.add(vec2(1.0, 0.0).mul(invRes))
    )
    const p12 = uFeedbackTexture.sample(
      uvCoord.add(vec2(0.0, 1.0).mul(invRes))
    )

    const finalSample = p00.toVar()

    // For each neighbor: replace if neighbor.g < finalSample.g AND neighbor.g < 1.0
    // step(ng, fg - eps) = 1 when fg - eps >= ng (i.e. ng < fg approximately)
    // 1 - step(1.0, ng) = 1 when ng < 1.0
    const r1 = float(step(p10.g, finalSample.g.sub(0.0001))).mul(
      float(1.0).sub(float(step(float(1.0), p10.g)))
    )
    finalSample.assign(mix(finalSample, p10, r1))

    const r2 = float(step(p01.g, finalSample.g.sub(0.0001))).mul(
      float(1.0).sub(float(step(float(1.0), p01.g)))
    )
    finalSample.assign(mix(finalSample, p01, r2))

    const r3 = float(step(p21.g, finalSample.g.sub(0.0001))).mul(
      float(1.0).sub(float(step(float(1.0), p21.g)))
    )
    finalSample.assign(mix(finalSample, p21, r3))

    const r4 = float(step(p12.g, finalSample.g.sub(0.0001))).mul(
      float(1.0).sub(float(step(float(1.0), p12.g)))
    )
    finalSample.assign(mix(finalSample, p12, r4))

    // Increment growth
    finalSample.g.addAssign(0.02)

    // 2D hash noise (cheap replacement for mx_noise_float)
    const noise = hashNoise3d(vec3(pixel.x, pixel.y, float(0.0)))

    // Kill wave if growth exceeds threshold: g > 2.0 + noise → set g = 1000
    const killThreshold = float(2.0).add(noise)
    const shouldKill = step(killThreshold, finalSample.g)
    finalSample.g.assign(mix(finalSample.g, float(1000.0), shouldKill))

    return finalSample
  })

  const result = Fn(() => {
    const vUv = uv()

    // Frame initialization: if uFrame < 3, output init value
    // step(3, uFrame) = 1 when uFrame >= 3; isInit = 1 when uFrame < 3
    const isInit = float(1.0).sub(step(float(3), uFrame))
    const initColor = vec3(3.0, 100000.0, 0.0)

    // Normal computation
    const p = vec2(0.5, 0.5).sub(vUv).mul(-2.0)
    const expandedSample = samplePrevFn(vUv)
    const color = expandedSample.rgb.toVar()

    // Mouse circle interaction (branchless)
    const circle = length(p.sub(uMousePosition)).sub(0.01)
    const circleNeg = float(1.0).sub(step(float(0.0), circle))
    const mouseIsMoving = float(step(float(0.001), uMouseMoving))
    const mouseActive = circleNeg.mul(mouseIsMoving)

    color.r.assign(mix(color.r, uMouseDepth, mouseActive))
    color.g.assign(mix(color.g, float(0.0), mouseActive))

    return vec4(mix(color, initColor, isInit), 1.0)
  })()

  material.colorNode = result.rgb
  material.opacityNode = result.a

  // Compatibility layer: consumer accesses material.uniforms.X.value
  // Proxy handles `material.uniforms.X = { value: Y }` by forwarding to X.value = Y
  ;(material as any).uniforms = new Proxy(
    { uFrame, uFeedbackTexture, uMousePosition, uMouseMoving, uMouseDepth },
    {
      set(target: any, prop: string | symbol, value: any) {
        if (
          prop in target &&
          value &&
          typeof value === "object" &&
          "value" in value
        ) {
          target[prop].value = value.value
          return true
        }
        return Reflect.set(target, prop, value)
      }
    }
  )

  return material as NodeMaterial & {
    uniforms: Record<string, { value: any }>
  }
}
