import { animate as animateMotion } from "motion"
import { MeshStandardMaterial, Texture, Vector3 } from "three"
import { Color, ShaderMaterial } from "three"
import { create } from "zustand"

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
    lightMapMultiplier: { value: 1.0 },
    aoMap: { value: null },
    aoMapIntensity: { value: 0.0 },
    aoMapMultiplier: { value: 1.0 },
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
    uJitter: { value: 512.0 },
    glassReflex: { value: null },
    emissiveMap: { value: emissiveMap },

    aoWithCheckerboard: { value: false },
    isBasketball: { value: false },
    uBasketballTransition: { value: 0 },
    uBasketballFogColorTransition: { value: 0 },
    uGodrayOpacity: { value: 0 },
    uGodrayDensity: { value: 0 }
  } as Record<string, { value: unknown }>

  if (defines?.LIGHT) {
    uniforms["lightDirection"] = { value: lightDirection }
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
      GLASS: defines?.GLASS,
      GODRAY: defines?.GODRAY,
      LIGHT: Boolean(defines?.LIGHT)
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

interface CustomShaderMaterialStore {
  /**
   * Will not cause re-renders to use this object
   */
  materialsRef: Record<string, ShaderMaterial>
  addMaterial: (material: ShaderMaterial) => void
  removeMaterial: (id: number) => void
  setIsBasketball: (value: boolean) => void
  updateFogSettings: (
    newFogColor: Vector3,
    newFogDensity: number,
    newFogDepth: number
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
    setIsBasketball: (value) => {
      const materials = get().materialsRef

      Object.values(materials).forEach((material) => {
        material.uniforms.isBasketball.value = value

        // Animate basketball transition
        animateMotion(
          material.uniforms.uBasketballTransition.value as number,
          value ? 1 : 0,
          {
            duration: 2,
            ease: [0.4, 0, 0.2, 1],
            onUpdate: (latest) => {
              material.uniforms.uBasketballTransition.value = latest
            }
          }
        )
      })
    },
    updateFogSettings: (
      newFogColor: Vector3,
      newFogDensity: number,
      newFogDepth: number
    ) => {
      const materials = get().materialsRef

      Object.values(materials).forEach((material) => {
        const startFogColor = material.uniforms.fogColor.value as Vector3
        const isBasketballTransition = material.uniforms.isBasketball
          .value as boolean

        const axes: Array<"x" | "y" | "z"> = ["x", "y", "z"]
        axes.forEach((axis) => {
          animateMotion(startFogColor[axis], newFogColor[axis], {
            duration: 2,
            ease: [0.4, 0, 0.2, 1],
            onUpdate: (latest) => {
              material.uniforms.fogColor.value[axis] = latest
            }
          })
        })

        animateMotion(
          material.uniforms.fogDensity.value as number,
          newFogDensity,
          {
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
            onUpdate: (latest) => {
              material.uniforms.fogDensity.value = latest
            }
          }
        )

        animateMotion(material.uniforms.fogDepth.value as number, newFogDepth, {
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1],
          onUpdate: (latest) => {
            material.uniforms.fogDepth.value = latest
          }
        })
      })
    }
  })
)
