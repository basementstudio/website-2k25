import { Box2, type BufferGeometry, ShaderMaterial, Vector2 } from "three"

import fragmentShader from "./fragment.glsl"
import { createIpodScreen } from "./screen"
import vertexShader from "./vertex.glsl"

export const createIpodScreenMaterial = (geometry: BufferGeometry) => {
  // Ipod-screen's UVs are a small island in the office atlas, not 0-1 —
  // pass its bounds so the shader can remap to screen space.
  const uv = geometry.attributes.uv
  const bounds = new Box2()
  for (let i = 0; i < uv.count; i++) {
    bounds.expandByPoint(new Vector2(uv.getX(i), uv.getY(i)))
  }

  const screen = createIpodScreen()

  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      fadeFactor: { value: 0 },
      inspectingFactor: { value: 0 },
      uScreen: { value: screen.texture },
      uUvMin: { value: bounds.min },
      uUvMax: { value: bounds.max }
    },
    vertexShader,
    fragmentShader
  })
  material.userData.updateScreen = screen.update

  return material
}
