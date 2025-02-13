import { ShaderMaterial } from "three"

import frag from "./frag.glsl"
import vert from "./vert.glsl"

export const createScreenMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      map: { value: null },
      uRevealProgress: { value: 1.0 }
    },
    vertexShader: vert,
    fragmentShader: frag
  })
