import { ShaderMaterial } from "three"

import fragmentShader from "./shaders/index.frag"
import vertexShader from "./shaders/index.vert"

export function getCharacterMaterial() {
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader
  })

  return material
}
