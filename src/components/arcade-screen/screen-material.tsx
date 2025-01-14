import { ShaderMaterial } from "three"

import frag from "./frag.glsl"
import vert from "./vert.glsl"

export const screenMaterial = new ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    map: { value: null }
  },
  vertexShader: vert,
  fragmentShader: frag
})
