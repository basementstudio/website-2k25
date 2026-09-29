import { ShaderMaterial } from "three"

import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

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
      },
      // Shared with the office materials so characters go dark (and flash)
      // with them during the Halloween storm.
      uLightFlicker: lightFlickerUniform,
      uLightning: lightningUniform
    },
    vertexShader,
    fragmentShader
  })
