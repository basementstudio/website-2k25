import { ShaderMaterial } from "three"

import fragmentShader from "./shaders/index.frag"
import vertexShader from "./shaders/index.vert"

export function getCharacterMaterial() {
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uMapSampler: {
        value: null
      },
      fadeFactor: {
        value: 0
      }
    }
  })

  return material
}
