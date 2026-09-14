import { cos, Fn, positionGeometry, sin, uv, vec2, vec3 } from "three/tsl"

import { bindUniform, createNodeMaterial } from "@/lib/graphics/material"
import { createShader as fragmentNodeFactory } from "@/shaders/generated/steam"

export const createSteamMaterial = () => {
  const material = createNodeMaterial({
    transparent: true,
    side: 2,
    uniforms: {
      uTime: { value: 0 },
      uNoise: { value: null }
    },
    fragmentNodeFactory
  })
  const time: any = bindUniform(material.uniforms, "uTime", "float")
  const noise: any = bindUniform(material.uniforms, "uNoise", "texture")
  material.positionNode = Fn(() => {
    const offset = noise
      .sample(vec2(0.25, time.mul(0.005)))
      .r.mul(uv().y.pow(1.2))
      .mul(0.035)
    const angle = noise
      .sample(vec2(0.5, uv().y.mul(0.2).sub(time.mul(0.005))))
      .r.mul(8)
    const x = positionGeometry.x.add(offset)
    const z = positionGeometry.z
    return vec3(
      x.mul(cos(angle)).sub(z.mul(sin(angle))),
      positionGeometry.y,
      x.mul(sin(angle)).add(z.mul(cos(angle)))
    )
  })()
  return material
}
