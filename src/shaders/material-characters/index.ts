import { ShaderMaterial } from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const createCharacterMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uMapSampler: {
        value: null
      },
      fadeFactor: {
        value: 0
      }
    },
    vertexShader,
    fragmentShader
  })
