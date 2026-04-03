import { Texture, Vector2 } from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Fn,
  float,
  vec3,
  vec4,
  uniform,
  texture,
  positionWorld,
  cameraPosition,
  cameraViewMatrix,
  cameraProjectionMatrix,
  mx_noise_float,
  round,
  abs,
  clamp,
  fract,
  pow,
  step,
  distance,
  dot,
  time
} from "three/tsl"

export const createSolidRevealMaterial = () => {
  const uTime = time
  const uReveal = uniform(0)
  const uScreenReveal = uniform(0)
  const uFlowTexture = texture(new Texture())
  const uScreenSize = uniform(new Vector2(1, 1))
  const uNear = uniform(0.1)
  const uFar = uniform(100)

  const material = new NodeMaterial()

  // Fast hash noise for voxel-snapped positions (replaces one mx_noise_float)
  // Perlin smoothness is wasted on quantized grid positions — hash is equivalent
  const hashNoise3d = /* @__PURE__ */ Fn(([p]: [any]) => {
    const p3 = fract(p.mul(vec3(0.1031, 0.1030, 0.0973))).toVar()
    p3.addAssign(dot(p3, vec3(p3.y, p3.z, p3.x).add(33.33)))
    return fract(p3.x.add(p3.y).mul(p3.z)).mul(2.0).sub(1.0)
  })

  // worldToUv: project world position to screen UV via camera matrices
  const worldToUvFn = /* @__PURE__ */ Fn(([p]: [any]) => {
    const clipPos = cameraProjectionMatrix.mul(cameraViewMatrix).mul(
      vec4(p, 1.0)
    )
    const ndcPos = clipPos.xyz.div(clipPos.w)
    return ndcPos.xy.add(1.0).mul(0.5)
  })

  // valueRemap helper
  const valueRemapFn = /* @__PURE__ */ Fn(
    ([value, inMin, inMax, outMin, outMax]: [any, any, any, any, any]) => {
      return float(outMin).add(
        float(outMax)
          .sub(outMin)
          .mul(float(value).sub(inMin))
          .div(float(inMax).sub(inMin))
      )
    }
  )

  material.colorNode = Fn(() => {
    // World position with offset
    const p = positionWorld.add(vec3(0.0, 0.11, 0.1))

    // Voxel computation: snap to grid
    const voxelSize = float(15.0)
    const voxelCenter = round(p.mul(voxelSize)).div(voxelSize)

    // High-freq hash noise for voxel grid (reveal threshold, flow SDF modulation)
    const noiseSmall = hashNoise3d(voxelCenter.mul(20.0))

    // Low-freq animated Perlin noise (creates visible sweeping wave pattern)
    const noiseBig = mx_noise_float(
      voxelCenter.mul(0.2).add(vec3(0, 0, uTime.mul(0.05)))
    )

    // Screen reveal discard
    noiseSmall.mul(0.5).add(0.5).lessThan(uScreenReveal).discard()

    // Color bump computation
    const colorBump = noiseBig.mul(1.5).toVar()
    colorBump.assign(clamp(colorBump, -1.0, 1.0))
    colorBump.subAssign(noiseSmall.mul(0.1))
    colorBump.addAssign(uTime.mul(0.2))
    colorBump.assign(fract(colorBump))
    colorBump.assign(valueRemapFn(colorBump, 0.0, 0.1, 1.0, 0.0))
    colorBump.assign(clamp(colorBump, 0.0, 1.0))
    colorBump.assign(pow(colorBump, float(2.0)))
    // Branchless reveal condition
    colorBump.mulAssign(
      float(step(pow(noiseSmall.mul(0.5).add(0.5), float(2.0)), uReveal))
    )
    colorBump.mulAssign(0.4)

    // Project voxel center to screen UV for flow texture sampling
    const screenUv = worldToUvFn(voxelCenter)
    const flowColor = uFlowTexture.sample(screenUv)

    // Flow SDF computation
    const distToCamera = distance(cameraPosition, voxelCenter)
    const flowCenter = flowColor.r
    const flowRadius = flowColor.g

    const flowSdf = abs(distToCamera.sub(flowCenter)).toVar()
    flowSdf.assign(abs(flowSdf.sub(flowRadius)))
    flowSdf.assign(float(1.0).sub(flowSdf))
    flowSdf.subAssign(noiseSmall)
    flowSdf.assign(valueRemapFn(flowSdf, 0.5, 1.0, 0.0, 1.0))
    flowSdf.assign(clamp(flowSdf, 0.0, 1.0))
    flowSdf.assign(pow(flowSdf, float(4.0)))

    return vec3(clamp(flowSdf.add(colorBump), 0.0, 1.0))
  })()

  material.opacityNode = float(1.0)

  // Compatibility layer: consumer accesses material.uniforms.X.value
  // uTime uses TSL `time` singleton — auto-updates per render, no CPU pumping needed
  ;(material as any).uniforms = {
    uReveal,
    uScreenReveal,
    uFlowTexture,
    uScreenSize,
    uNear,
    uFar
  }

  return material
}
