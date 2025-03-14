import { GLSL3, RawShaderMaterial } from "three"

import fragmentShader from "./shaders/index.frag"
import vertexShader from "./shaders/index.vert"

export function getSolidRevealMaterial() {
  return new RawShaderMaterial({
    vertexShader,
    fragmentShader,
    glslVersion: GLSL3,
    uniforms: {
      uTime: { value: 0.0 },
      uReveal: { value: 0.0 },
      uScreenReveal: { value: 0.0 }
    }
  })
}
