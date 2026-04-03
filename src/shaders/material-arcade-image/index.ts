import { Texture } from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Fn,
  float,
  vec2,
  vec4,
  uniform,
  uv,
  texture,
  select
} from "three/tsl"

export const createImageMaterial = ({
  map = new Texture(),
  opacity = 1,
  imageAspect = 1,
  containerAspect = 1
} = {}) => {
  const uMap = texture(map)
  const uOpacity = uniform(opacity)
  const uImageAspect = uniform(imageAspect)
  const uContainerAspect = uniform(containerAspect)

  const material = new NodeMaterial()
  material.transparent = true
  material.depthWrite = false

  material.colorNode = Fn(() => {
    const vUv = uv()

    // Object-fit: cover — scale UV to crop and fill
    const scale = select(
      uImageAspect.greaterThan(uContainerAspect),
      vec2(uContainerAspect.div(uImageAspect), 1.0),
      vec2(1.0, uImageAspect.div(uContainerAspect))
    )
    const offset = vec2(0.5, 0.5).sub(scale.mul(0.5))
    const adjustedUv = vUv.mul(scale).add(offset)

    const color = uMap.sample(adjustedUv)
    return vec4(color.rgb, color.a.mul(uOpacity))
  })()

  return {
    material,
    uniforms: { uMap, uOpacity, uImageAspect, uContainerAspect }
  }
}
