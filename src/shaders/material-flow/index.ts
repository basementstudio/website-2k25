import { GLSL3, RawShaderMaterial, Vector2 } from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const createFlowMaterial = () =>
  new RawShaderMaterial({
    glslVersion: GLSL3,
    uniforms: {
      uFrame: { value: 0 },
      uFeedbackTexture: { value: null },
      uMousePosition: { value: new Vector2(10, 10) },
      uMouseMoving: { value: 0 },
      uMouseDepth: { value: 0 }
    },
    vertexShader,
    fragmentShader
  })
