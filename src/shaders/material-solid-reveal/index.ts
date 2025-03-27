import { GLSL3, RawShaderMaterial, Vector2 } from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const createSolidRevealMaterial = () =>
  new RawShaderMaterial({
    glslVersion: GLSL3,
    uniforms: {
      uTime: { value: 0.0 },
      uReveal: { value: 0.0 },
      uScreenReveal: { value: 0.0 },
      uFlowTexture: { value: null },
      uScreenSize: { value: new Vector2(1, 1) },
      uNear: { value: 0.1 },
      uFar: { value: 100 }
    },
    vertexShader,
    fragmentShader
  })
