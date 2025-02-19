import { ShaderMaterial } from "three"

import frag from "./frag.glsl"
import vert from "./vert.glsl"

export const screenMaterial = new ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    map: { value: null },
    iResolutionY: { value: 390.0 },
    iResolutionX: { value: 250.0 },
    uBrightness: { value: 7.0 },
    uIsMonochrome: { value: true }
  },
  vertexShader: vert,
  fragmentShader: frag
})
