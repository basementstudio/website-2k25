import { Color, Texture } from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Fn,
  float,
  vec4,
  uniform,
  uv,
  texture,
  max,
  min,
  smoothstep
} from "three/tsl"

export const createTextMaterial = ({
  atlas = new Texture(),
  color = new Color(1, 0.3, 0),
  opacity = 1
} = {}) => {
  const uAtlas = texture(atlas)
  const uColor = uniform(color)
  const uOpacity = uniform(opacity)

  const material = new NodeMaterial()
  material.transparent = true
  material.depthWrite = false

  material.colorNode = Fn(() => {
    const vUv = uv()

    // Sample the 3-channel MSDF atlas
    const msdf = uAtlas.sample(vUv)
    const r = msdf.r
    const g = msdf.g
    const b = msdf.b

    // Standard MSDF median
    const median = max(min(r, g), min(max(r, g), b))

    // Signed distance: 0.5 is the exact edge
    const sd = median.sub(0.5)

    // Anti-aliased alpha via smoothstep
    // Tighter range = crisper text (good for small render target sizes)
    const alpha = smoothstep(float(-0.05), float(0.05), sd)

    // Discard fully transparent fragments
    alpha.lessThan(0.01).discard()

    return vec4(uColor, alpha.mul(uOpacity))
  })()

  return {
    material,
    uniforms: { uAtlas, uColor, uOpacity }
  }
}
