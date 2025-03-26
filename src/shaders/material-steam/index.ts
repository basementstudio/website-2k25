import { ShaderMaterial } from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const createSteamMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    side: 2,
    uniforms: {
      uTime: { value: 0 },
      uNoise: { value: null }
    },
    fragmentShader,
    vertexShader
  })
