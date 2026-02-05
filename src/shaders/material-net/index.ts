import { DataTexture, DoubleSide, Texture } from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Fn,
  vec2,
  float,
  uniform,
  uv,
  texture,
  attribute,
  positionLocal
} from "three/tsl"

export const createNetMaterial = () => {
  const tDisplacement = texture(new DataTexture())
  const tMap = texture(new Texture())
  const uCurrentFrame = uniform(0)
  const uTotalFrames = uniform(1)
  const uOffsetScale = uniform(1)

  const material = new NodeMaterial()
  material.transparent = true
  material.side = DoubleSide

  // Vertex: displace position using DataTexture lookup via uv1 attribute
  material.positionNode = Fn(() => {
    const aUv1 = attribute("uv1", "vec2")
    const dispUv = vec2(
      aUv1.x,
      float(1.0).sub(uCurrentFrame.div(uTotalFrames))
    )
    const offset = tDisplacement.sample(dispUv).xzy
    const pos = positionLocal.toVar()
    pos.addAssign(offset.mul(uOffsetScale))
    return pos
  })()

  // Fragment: sample diffuse texture
  const texSample = tMap.sample(uv())
  material.colorNode = texSample.rgb
  material.opacityNode = texSample.a

  return {
    material,
    uniforms: {
      tDisplacement,
      map: tMap,
      currentFrame: uCurrentFrame,
      totalFrames: uTotalFrames,
      offsetScale: uOffsetScale
    }
  }
}
