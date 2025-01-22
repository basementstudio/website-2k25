import { ShaderMaterial } from "three"

import frag from "./frag.glsl"
import vert from "./vert.glsl"

export const screenMaterial = new ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    map: { value: null },
    intensity: { value: 4 }
  },
  vertexShader: vert,
  fragmentShader: frag
})
