import { DoubleSide, type MeshStandardMaterial, ShaderMaterial } from "three"

import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

import frag from "./asset-frag.glsl"
import vert from "./asset-vert.glsl"

export const createPumpkinMaterial = (
  base: MeshStandardMaterial,
  vertexColors: boolean,
  opacity = 1
) =>
  new ShaderMaterial({
    name: "halloween-pumpkin-asset",
    defines: { USE_PUMPKIN_EMISSIVE_MAP: Boolean(base.emissiveMap) },
    vertexColors,
    vertexShader: vert,
    fragmentShader: frag,
    side: DoubleSide,
    transparent: opacity < 1,
    depthWrite: opacity === 1,
    uniforms: {
      uMap: { value: base.map },
      uTint: { value: base.color.clone() },
      uEmissiveMap: { value: base.emissiveMap },
      uEmissive: {
        value: base.emissive.clone().multiplyScalar(base.emissiveIntensity)
      },
      uEmissivePulse: { value: 1 },
      uHover: { value: 0 },
      uOpacity: { value: opacity },
      fadeFactor: { value: 0 },
      uLightFlicker: lightFlickerUniform,
      uLightning: lightningUniform
    }
  })
