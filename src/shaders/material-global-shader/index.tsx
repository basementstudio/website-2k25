import { MeshStandardMaterial, Texture, Vector3 } from "three"
import { Color, ShaderMaterial } from "three"
import { create } from "zustand"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const GLOBAL_SHADER_MATERIAL_NAME = "global-shader-material"

export const createGlobalShaderMaterial = (
  baseMaterial: MeshStandardMaterial,
  reverse: boolean
) => {
  const {
    color: baseColor = new Color(1, 1, 1),
    map = null,
    opacity: baseOpacity = 1.0,
    metalness,
    roughness,
    alphaMap
  } = baseMaterial

  const emissiveColor = new Color("#FF4D00").multiplyScalar(9)

  const material = new ShaderMaterial({
    name: GLOBAL_SHADER_MATERIAL_NAME,
    defines: {
      USE_MAP: map !== null,
      IS_TRANSPARENT: alphaMap !== null || baseMaterial.transparent,
      USE_ALPHA_MAP: alphaMap !== null,
      USE_EMISSIVE: baseMaterial.emissiveIntensity !== 0
    },
    uniforms: {
      uColor: { value: emissiveColor },
      uProgress: { value: 0.0 },
      uReverse: { value: reverse },
      map: { value: map },
      lightMap: { value: null },
      lightMapIntensity: { value: 0.0 },
      metalness: { value: metalness },
      roughness: { value: roughness },
      mapRepeat: { value: map ? map.repeat : { x: 1, y: 1 } },
      baseColor: { value: baseColor },
      opacity: { value: baseOpacity },
      noiseFactor: { value: 0.5 },
      uLoaded: { value: 0 },
      uTime: { value: 0.0 },
      alphaMap: { value: alphaMap },
      emissive: { value: baseMaterial.emissive || new Vector3() },
      emissiveIntensity: { value: baseMaterial.emissiveIntensity || 0 },
      fogColor: { value: new Vector3(0.4, 0.4, 0.4) },
      fogDensity: { value: 0.05 },
      fogDepth: { value: 6.0 }
    },
    transparent:
      baseOpacity < 1 || alphaMap !== null || baseMaterial.transparent,
    vertexShader,
    fragmentShader,
    side: baseMaterial.side
  })

  material.needsUpdate = true
  material.customProgramCacheKey = () => GLOBAL_SHADER_MATERIAL_NAME

  useCustomShaderMaterial.getState().addMaterial(material)

  baseMaterial.dispose()

  return material
}

interface CustomShaderMaterialStore {
  /**
   * Will not cause re-renders to use this object
   */
  materialsRef: Record<string, ShaderMaterial>
  addMaterial: (material: ShaderMaterial) => void
  removeMaterial: (id: number) => void
}

export const useCustomShaderMaterial = create<CustomShaderMaterialStore>(
  (_set, get) => ({
    materialsRef: {},
    addMaterial: (material) => {
      const materials = get().materialsRef
      materials[material.id] = material
    },
    removeMaterial: (id) => {
      const materials = get().materialsRef
      delete materials[id]
    }
  })
)
