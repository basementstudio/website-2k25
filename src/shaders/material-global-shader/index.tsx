import { animate } from "motion"
import { MeshStandardMaterial, Vector3 } from "three"
import { Color, ShaderMaterial } from "three"
import { create } from "zustand"

import { TRANSITION_DURATION } from "@/constants/transitions"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const GLOBAL_SHADER_MATERIAL_NAME = "global-shader-material"

export const createGlobalShaderMaterial = (
  baseMaterial: MeshStandardMaterial,
  reverse: boolean,
  defines?: {
    GLASS?: boolean
    GODRAY?: boolean
    LIGHT?: boolean
    FOG?: boolean
    MATCAP?: boolean
  }
) => {
  const {
    color: baseColor = new Color(1, 1, 1),
    map = null,
    opacity: baseOpacity = 1.0,
    metalness,
    roughness,
    alphaMap,
    emissiveMap,
    userData = {}
  } = baseMaterial

  const { lightDirection = null } = userData

  const emissiveColor = new Color("#FF4D00").multiplyScalar(9)

  const uniforms = {
    uColor: { value: emissiveColor },
    uProgress: { value: 0.0 },
    uReverse: { value: reverse },
    map: { value: map },
    lightMap: { value: null },
    lightMapIntensity: { value: 0.0 },
    aoMap: { value: null },
    aoMapIntensity: { value: 0.0 },
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
    fogDepth: { value: 6.0 },
    glassReflex: { value: null },
    emissiveMap: { value: emissiveMap },

    uGodrayOpacity: { value: 0 },
    uGodrayDensity: { value: 1.0 },
    inspectingEnabled: { value: false },
    inspectingFactor: { value: 0 },
    fadeFactor: { value: 0 },

    // Lamp
    lampLightmap: { value: null },
    lightLampEnabled: { value: false }
  } as Record<string, { value: unknown }>

  if (defines?.LIGHT) {
    uniforms["lightDirection"] = { value: lightDirection }
  }

  if (defines?.MATCAP) {
    uniforms["matcap"] = { value: null }
    uniforms["glassMatcap"] = { value: false }
  }

  const material = new ShaderMaterial({
    name: GLOBAL_SHADER_MATERIAL_NAME,
    defines: {
      USE_MAP: map !== null,
      IS_TRANSPARENT: alphaMap !== null || baseMaterial.transparent,
      USE_ALPHA_MAP: alphaMap !== null,
      USE_EMISSIVE:
        baseMaterial.emissiveIntensity !== 0 && emissiveMap === null,
      USE_EMISSIVEMAP: emissiveMap !== null,
      GLASS: defines?.GLASS !== undefined ? Boolean(defines?.GLASS) : false,
      GODRAY: defines?.GODRAY !== undefined ? Boolean(defines?.GODRAY) : false,
      LIGHT: defines?.LIGHT !== undefined ? Boolean(defines?.LIGHT) : false,
      FOG: defines?.FOG !== undefined ? Boolean(defines?.FOG) : true,
      MATCAP: defines?.MATCAP !== undefined ? Boolean(defines?.MATCAP) : false
    },
    uniforms,
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

interface FogSettings {
  color: Vector3
  density: number
  depth: number
}

interface CustomShaderMaterialStore {
  /**
   * Will not cause re-renders to use this object
   */
  materialsRef: Record<string, ShaderMaterial>
  addMaterial: (material: ShaderMaterial) => void
  removeMaterial: (id: number) => void
  updateFogSettings: (
    { color, density, depth }: FogSettings,
    instant?: boolean
  ) => void
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
    },
    updateFogSettings: (
      { color, density, depth }: FogSettings,
      instant?: boolean
    ) => {
      const materials = get().materialsRef

      Object.values(materials).forEach((material) => {
        const startFogColor = material.uniforms.fogColor.value as Vector3

        const config = !instant
          ? { duration: TRANSITION_DURATION / 1000 }
          : { duration: 0 }

        const axes: Array<"x" | "y" | "z"> = ["x", "y", "z"]
        axes.forEach((axis) => {
          animate(startFogColor[axis], color[axis], {
            ...config,
            onUpdate: (latest) =>
              (material.uniforms.fogColor.value[axis] = latest)
          })
        })

        animate(material.uniforms.fogDensity.value as number, density, {
          ...config,
          onUpdate: (latest) => (material.uniforms.fogDensity.value = latest)
        })

        animate(material.uniforms.fogDepth.value as number, depth, {
          ...config,
          onUpdate: (latest) => (material.uniforms.fogDepth.value = latest)
        })
      })
    }
  })
)
