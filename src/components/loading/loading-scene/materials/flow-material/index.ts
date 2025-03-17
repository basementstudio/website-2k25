import { RawShaderMaterial } from "three"

import fragmentShader from "./shaders/index.frag"
import vertexShader from "./shaders/index.vert"

// todo finish this
export function getFlowMaterial() {
  return new RawShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uRenderCount: { value: 0 }
    }
  })
}
