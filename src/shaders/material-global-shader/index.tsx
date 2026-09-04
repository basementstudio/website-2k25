import { Matrix3, MeshStandardMaterial, Vector3 } from "three"
import { Color, ShaderMaterial } from "three"
import { create } from "zustand"

import fragmentShader from "./fragment.glsl"
import vertexShader from "./vertex.glsl"

export const GLOBAL_SHADER_MATERIAL_NAME = "global-shader-material"

/**
 * Shared by every OUTDOOR material — the Sky component mutates this one
 * Vector3 (day/night tint) and all outdoor meshes pick it up.
 */
export const outdoorTintUniform = { value: new Vector3(1, 1, 1) }

/**
 * 0..1 gate on outdoor emissives (street lamps + their light cones): 1 at
 * night, 0 in daylight. Shared instance, written by the Sky component.
 */
export const outdoorEmissiveUniform = { value: 1 }

export const createGlobalShaderMaterial = (
  baseMaterial: MeshStandardMaterial,
  defines?: {
    GLASS?: boolean
    GODRAY?: boolean
    LIGHT?: boolean
    BASKETBALL?: boolean
    FOG?: boolean
    VIDEO?: boolean
    MATCAP?: boolean
    OUTDOOR?: boolean
    DAYLIGHT?: boolean
    IS_LOBO_MARINO?: boolean
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
    map: { value: map },
    mapMatrix: { value: new Matrix3().identity() },
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
    uTime: { value: 0.0 },
    alphaMap: { value: alphaMap },
    alphaMapTransform: { value: new Matrix3().identity() },
    emissive: { value: baseMaterial.emissive || new Vector3() },
    emissiveIntensity: { value: baseMaterial.emissiveIntensity || 0 },
    fogColor: { value: new Vector3(0.2, 0.2, 0.2) },
    fogDensity: { value: 0.05 },
    fogDepth: { value: 9.0 },
    glassReflex: { value: null },
    emissiveMap: { value: emissiveMap },

    // Inspectables
    inspectingEnabled: { value: false },
    inspectingFactor: { value: 0 },
    fadeFactor: { value: 0 },

    // Lamp
    lampLightmap: { value: null },
    lightLampEnabled: { value: false }
  } as Record<string, { value: unknown }>

  if (defines?.GODRAY) {
    uniforms["uGodrayOpacity"] = { value: 0 }
    uniforms["uGodrayDensity"] = { value: 0.75 }
  }

  if (defines?.LIGHT) {
    uniforms["lightDirection"] = { value: lightDirection }
  }

  if (defines?.BASKETBALL) {
    uniforms["lightDirection"] = { value: lightDirection }
    uniforms["backLightDirection"] = { value: new Vector3(0, 0, 1) }
  }

  if (defines?.MATCAP) {
    uniforms["matcap"] = { value: null }
    uniforms["glassMatcap"] = { value: false }
  }

  if (defines?.OUTDOOR) {
    uniforms["uOutdoorTint"] = outdoorTintUniform
    uniforms["uOutdoorEmissive"] = outdoorEmissiveUniform
  }

  // Street lights only: a genuinely emitting outdoor material. Checking the
  // emissive color matters — three defaults emissiveIntensity to 1 with a
  // black emissive, so USE_EMISSIVE alone would catch the city billboard too.
  const emissiveSum = baseMaterial.emissive
    ? baseMaterial.emissive.r +
      baseMaterial.emissive.g +
      baseMaterial.emissive.b
    : 0
  const isOutdoorLight =
    Boolean(defines?.OUTDOOR) &&
    emissiveMap === null &&
    baseMaterial.emissiveIntensity !== 0 &&
    emissiveSum > 0

  if (defines?.DAYLIGHT) {
    uniforms["daylight"] = { value: true }
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
      BASKETBALL:
        defines?.BASKETBALL !== undefined
          ? Boolean(defines?.BASKETBALL)
          : false,
      FOG: defines?.FOG !== undefined ? Boolean(defines?.FOG) : true,
      MATCAP: defines?.MATCAP !== undefined ? Boolean(defines?.MATCAP) : false,
      VIDEO: defines?.VIDEO !== undefined ? Boolean(defines?.VIDEO) : false,
      OUTDOOR:
        defines?.OUTDOOR !== undefined ? Boolean(defines?.OUTDOOR) : false,
      OUTDOOR_LIGHT: isOutdoorLight,
      IS_LOBO_MARINO:
        defines?.IS_LOBO_MARINO !== undefined
          ? Boolean(defines?.IS_LOBO_MARINO)
          : false,
      DAYLIGHT:
        defines?.DAYLIGHT !== undefined ? Boolean(defines?.DAYLIGHT) : false
    },
    uniforms,
    transparent:
      baseOpacity < 1 ||
      alphaMap !== null ||
      baseMaterial.transparent ||
      defines?.DAYLIGHT ||
      false,
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
