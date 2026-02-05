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
  distance
} from "three/tsl"

export const createSolidRevealMaterial = () => {
  const uTime = uniform(0)
  const uReveal = uniform(0)
  const uScreenReveal = uniform(0)
  const uFlowTexture = texture(new Texture())
  const uScreenSize = uniform(new Vector2(1, 1))
  const uNear = uniform(0.1)
  const uFar = uniform(100)

  const material = new NodeMaterial()

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

    // 3D noise (equivalent to cnoise3)
    const noiseSmall = mx_noise_float(voxelCenter.mul(20.0))

    // Approximate 4D noise via time-shifted 3D noise (equivalent to cnoise4)
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
  ;(material as any).uniforms = {
    uTime,
    uReveal,
    uScreenReveal,
    uFlowTexture,
    uScreenSize,
    uNear,
    uFar
  }

  return material
}
