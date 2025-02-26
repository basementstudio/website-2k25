import { ShaderMaterial } from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const createScreenMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      map: { value: null },
      uRevealProgress: { value: 1.0 }
    },
    vertexShader,
    fragmentShader
  })
