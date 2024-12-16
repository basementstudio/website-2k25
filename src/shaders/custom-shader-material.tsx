import type { MeshStandardMaterial, Texture } from "three"
import { Color, ShaderMaterial } from "three"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const BASE_SHADER_MATERIAL_NAME = "custom-shader-material"

export const createShaderMaterial = (
  baseMaterial: MeshStandardMaterial,
  lightMap: Texture | null,
  reverse: boolean
) => {
  const {
    color: baseColor = new Color(1, 1, 1),
    map = null,
    opacity: baseOpacity = 1.0
  } = baseMaterial

  const emissiveColor = new Color("#FF4D00").multiplyScalar(9)

  const material = new ShaderMaterial({
    name: BASE_SHADER_MATERIAL_NAME,
    uniforms: {
      envMap: { value: null },
      uColor: { value: emissiveColor },
      uProgress: { value: 0.0 },
      uReverse: { value: reverse },
      map: { value: map },
      lightMap: { value: lightMap },
      mapRepeat: { value: map ? map.repeat : { x: 1, y: 1 } },
      baseColor: { value: baseColor },
      opacity: { value: baseOpacity },
      noiseFactor: { value: 0.5 }
    },

    vertexShader,
    fragmentShader
  })

  material.needsUpdate = true
  material.customProgramCacheKey = () => BASE_SHADER_MATERIAL_NAME

  return material
}
