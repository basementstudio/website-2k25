import { RawShaderMaterial, Vector2, GLSL3 } from "three"

import fragmentShader from "./shaders/index.frag"
import vertexShader from "./shaders/index.vert"

export function getFlowMaterial() {
  return new RawShaderMaterial({
    vertexShader,
    fragmentShader,
    glslVersion: GLSL3,
    uniforms: {
      uFrame: { value: 0 },
      uFeedbackTexture: { value: null },
      uMousePosition: { value: new Vector2(10, 10) },
      uMouseMoving: { value: 0 },
      uMouseDepth: { value: 0 },
    }
  })
}
