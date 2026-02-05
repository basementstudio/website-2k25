import {
  Color,
  Matrix3,
  MeshStandardMaterial,
  ShaderMaterial,
  Texture,
  Vector2,
  Vector3
} from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Fn,
  float,
  vec2,
  vec3,
  vec4,
  uniform,
  uv,
  texture,
  attribute,
  positionView,
  normalView,
  screenCoordinate,
  normalize,
  cross,
  dot,
  exp,
  mix,
  step,
  clamp,
  min,
  max,
  floor,
  mod,
  select
} from "three/tsl"
import { create } from "zustand"

import { basicLight } from "@/shaders/utils/basic-light"

export const GLOBAL_SHADER_MATERIAL_NAME = "global-shader-material"

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
    CLOUDS?: boolean
    DAYLIGHT?: boolean
    IS_LOBO_MARINO?: boolean
  }
) => {
  const {
    color: baseColorVal = new Color(1, 1, 1),
    map = null,
    opacity: baseOpacity = 1.0,
    alphaMap,
    emissiveMap,
    userData = {}
  } = baseMaterial

  const { lightDirection: lightDir = null } = userData

  const emissiveColor = new Color("#FF4D00").multiplyScalar(9)

  // Compile-time feature flags (equivalent to GLSL #ifdef)
  const useMap = map !== null
  const isTransparent = alphaMap !== null || baseMaterial.transparent
  const useAlphaMap = alphaMap !== null
  const useEmissive =
    baseMaterial.emissiveIntensity !== 0 && emissiveMap === null
  const useEmissiveMap = emissiveMap !== null
  const isGlass = Boolean(defines?.GLASS)
  const isGodray = Boolean(defines?.GODRAY)
  const isLight = Boolean(defines?.LIGHT)
  const isBasketball = Boolean(defines?.BASKETBALL)
  const isFog = defines?.FOG !== undefined ? Boolean(defines.FOG) : true
  const isMatcap = Boolean(defines?.MATCAP)
  const isClouds = Boolean(defines?.CLOUDS)
  const isDaylight = Boolean(defines?.DAYLIGHT)
  const isLoboMarino = Boolean(defines?.IS_LOBO_MARINO)

  // --- TSL Uniform Nodes ---

  const uColor = uniform(emissiveColor)
  const uBaseColor = uniform(baseColorVal)
  const uMap = texture(map || new Texture())
  const uMapMatrix = uniform(new Matrix3().identity())
  const uMapRepeat = uniform(
    map ? new Vector2(map.repeat.x, map.repeat.y) : new Vector2(1, 1)
  )
  const uLightMap = texture(new Texture())
  const uLightMapIntensity = uniform(0)
  const uAoMap = texture(new Texture())
  const uAoMapIntensity = uniform(0)
  const uOpacity = uniform(baseOpacity)
  const uTime = uniform(0)
  const uNoiseFactor = uniform(0.5)
  const uAlphaMap = texture(alphaMap || new Texture())
  const uAlphaMapTransform = uniform(new Matrix3().identity())
  const uEmissive = uniform(baseMaterial.emissive || new Vector3())
  const uEmissiveIntensity = uniform(baseMaterial.emissiveIntensity || 0)
  const uEmissiveMap = texture(emissiveMap || new Texture())
  const uFogColor = uniform(new Vector3(0.2, 0.2, 0.2))
  const uFogDensity = uniform(0.05)
  const uFogDepth = uniform(9.0)
  const uGlassReflex = texture(new Texture())
  const uInspectingEnabled = uniform(0)
  const uInspectingFactor = uniform(0)
  const uFadeFactor = uniform(0)
  const uLampLightmap = texture(new Texture())
  const uLightLampEnabled = uniform(0)

  // Conditional uniforms (only created when the feature is active)
  let uGodrayOpacity: ReturnType<typeof uniform> | undefined
  let uGodrayDensity: ReturnType<typeof uniform> | undefined
  let uLightDirection: ReturnType<typeof uniform> | undefined
  let uBackLightDirection: ReturnType<typeof uniform> | undefined
  let uMatcapTex: ReturnType<typeof texture> | undefined
  let uGlassMatcap: ReturnType<typeof uniform> | undefined
  let uDaylight: ReturnType<typeof uniform> | undefined

  if (isGodray) {
    uGodrayOpacity = uniform(0)
    uGodrayDensity = uniform(0.75)
  }

  if (isLight || isBasketball) {
    uLightDirection = uniform(lightDir || new Vector3(0, 1, 0))
  }

  if (isBasketball) {
    uBackLightDirection = uniform(new Vector3(0, 0, 1))
  }

  if (isMatcap) {
    uMatcapTex = texture(new Texture())
    uGlassMatcap = uniform(0)
  }

  if (isDaylight) {
    uDaylight = uniform(1)
  }

  // --- Material ---

  const material = new NodeMaterial()
  material.name = GLOBAL_SHADER_MATERIAL_NAME
  material.transparent =
    baseOpacity < 1 || isTransparent || isDaylight
  material.side = baseMaterial.side

  // --- Shared vertex/fragment nodes ---

  const vUv1 = uv()
  const aUv1 = attribute("uv1", "vec2")
  const vUv2 = select(aUv1.x.greaterThan(0.0), aUv1, vUv1)

  // --- Main shader computation ---

  const result = Fn(() => {
    const normalizedNormal = normalView
    const viewDir = normalize(positionView.negate())
    const oneMinusFadeFactor = float(1.0).sub(uFadeFactor)
    const isInspectionMode = float(step(float(0.001), uInspectingFactor))
    const shouldFadeF = float(uInspectingEnabled).mul(
      float(1.0).sub(isInspectionMode)
    )

    // --- Map sampling ---

    let mapSample: any
    if (useMap) {
      const uvH = vec3(vUv1.x, vUv1.y, float(1.0))
      const mapUv = uMapMatrix.mul(uvH).xy.mul(uMapRepeat)
      mapSample = uMap.sample(mapUv)
    } else {
      mapSample = vec4(1.0, 1.0, 1.0, 1.0)
    }

    if (isClouds) {
      mapSample = uMap.sample(vec2(vUv1.x.sub(uTime.mul(0.004)), vUv1.y))
    }

    // --- Base color ---

    const color = uBaseColor.mul(mapSample.rgb)

    // --- Lightmap sampling (select between lamp lightmap and regular) ---

    const lightMapSample = mix(
      uLightMap.sample(vUv2).rgb,
      uLampLightmap.sample(vUv2).rgb,
      uLightLampEnabled
    )

    const irradiance = color.toVar()

    // --- Emissive ---

    if (useEmissive || useEmissiveMap) {
      const ei = uEmissiveIntensity
        .mul(mix(float(1.0), oneMinusFadeFactor, shouldFadeF))
        .toVar()

      if (useEmissive) {
        irradiance.addAssign(uEmissive.mul(ei))
      }

      if (useEmissiveMap) {
        irradiance.mulAssign(uEmissiveMap.sample(vUv1).rgb.mul(ei))
      }
    }

    // --- Inspection mode lighting ---
    // Always computed; mixed into irradiance based on inspectingFactor

    const lf = irradiance.toVar()

    lf.mulAssign(basicLight(normalizedNormal, viewDir, float(4.0)))

    const fillLightDir = normalize(cross(viewDir, vec3(0.0, 1.0, 0.0)))
    lf.mulAssign(basicLight(normalizedNormal, fillLightDir, float(2.0)))

    const rimLightDir = normalize(
      viewDir.negate().add(vec3(0.0, 0.5, 0.0))
    )
    lf.mulAssign(basicLight(normalizedNormal, rimLightDir, float(3.0)))

    if (isMatcap) {
      const nvz = vec3(viewDir.z.negate(), float(0.0), viewDir.x)
      const xAxis = normalize(nvz)
      const yAxis = cross(viewDir, xAxis)
      const matcapUv = vec2(
        dot(xAxis, normalizedNormal),
        dot(yAxis, normalizedNormal)
      )
        .mul(0.495)
        .add(0.5)
      lf.mulAssign(uMatcapTex!.sample(matcapUv).rgb)
    }

    // --- Lightmap application (skip for VIDEO) ---

    if (!defines?.VIDEO) {
      const lmFactor = mix(
        vec3(1.0, 1.0, 1.0),
        lightMapSample.mul(uLightMapIntensity),
        step(float(0.001), uLightMapIntensity)
      )
      irradiance.mulAssign(lmFactor)
    }

    // --- AO map ---

    const ao = uAoMap.sample(vUv2).r.sub(1.0).mul(uAoMapIntensity).add(1.0)
    irradiance.mulAssign(
      mix(float(1.0), ao, step(float(0.001), uAoMapIntensity))
    )

    // --- Blend inspection lighting ---

    irradiance.assign(
      mix(irradiance, lf, clamp(uInspectingFactor, 0.0, 1.0))
    )

    // --- Opacity ---

    const opacityResult = uOpacity.toVar()

    if (isTransparent) {
      opacityResult.mulAssign(mapSample.a)
    }

    if (useAlphaMap) {
      const alphaUv = uAlphaMapTransform
        .mul(vec3(vUv1.x, vUv1.y, float(1.0)))
        .xy
      opacityResult.mulAssign(uAlphaMap.sample(alphaUv).r)
    }

    // Discard fully transparent
    opacityResult.lessThan(float(0.001)).discard()

    // --- Directional lighting ---

    if (isLight) {
      const dotNL = dot(uLightDirection!, normalizedNormal)
      const lightFactor = dotNL.sub(0.2).mul(1.125).add(0.1).toVar()
      lightFactor.assign(clamp(lightFactor, 0.0, 1.0))
      lightFactor.assign(lightFactor.mul(lightFactor))

      if (isBasketball) {
        const dotBackNL = dot(uBackLightDirection!, normalizedNormal)
        const backLF = dotBackNL.sub(0.05).mul(0.947368).add(0.1).toVar()
        backLF.assign(clamp(backLF, 0.0, 1.0))
        backLF.assign(backLF.mul(backLF))
        lightFactor.mulAssign(8.0)
        backLF.mulAssign(4.0)
        lightFactor.assign(max(lightFactor, backLF.mul(1.5)))
      } else {
        lightFactor.mulAssign(3.0)
      }

      lightFactor.addAssign(1.0)
      irradiance.mulAssign(lightFactor)
    }

    // --- Checker pattern (GLASS / GODRAY / MATCAP) ---

    let pattern: any
    if (isGlass || isGodray || isMatcap) {
      const shiftedCoord = screenCoordinate.xy.add(vec2(2.0, 2.0))
      const checkerPos = floor(shiftedCoord.mul(0.5))
      pattern = mod(checkerPos.x.add(checkerPos.y), 2.0)
    }

    // --- Glass reflex ---

    if (isGlass) {
      const glassUv = vUv1
        .mul(vec2(0.75, 0.75))
        .add(viewDir.xy.mul(vec2(-0.25, 0.25)))
        .add(vec2(0.125, 0.125))
      const reflexSample = uGlassReflex.sample(glassUv)
      const reflexActive = step(float(0.001), reflexSample.a)
      const mixF = float(0.075)
      const reflexBlend = irradiance
        .mul(float(1.0).sub(mixF))
        .add(reflexSample.rgb.mul(mixF))
      irradiance.assign(mix(irradiance, reflexBlend, reflexActive))
      opacityResult.mulAssign(pattern!)
    }

    // --- Godray ---

    if (isGodray) {
      opacityResult.mulAssign(
        pattern!.mul(uGodrayOpacity!).mul(uGodrayDensity!)
      )
    }

    // --- Fog ---

    if (isFog) {
      const fogDepthVal = min(positionView.z.add(uFogDepth), float(0.0))
      const fogDensSq = uFogDensity.mul(uFogDensity)
      const fogDepthSq = fogDepthVal.mul(fogDepthVal)
      const fogFactor = clamp(
        float(1.0).sub(exp(fogDensSq.mul(fogDepthSq).negate())),
        0.0,
        1.0
      )
      irradiance.assign(mix(irradiance, uFogColor, fogFactor))
    }

    // --- Lobo Marino fresnel ---

    if (isLoboMarino) {
      const fresnelFactor = float(1.0).sub(dot(viewDir, normalizedNormal))
      const col = mix(uColor, irradiance, 0.5).toVar()
      col.assign(mix(col, col.mul(4.0), fresnelFactor))
      irradiance.assign(col)
    }

    // --- Fade ---

    irradiance.mulAssign(mix(float(1.0), oneMinusFadeFactor, shouldFadeF))

    // --- MATCAP glassMatcap alpha ---

    if (isMatcap) {
      opacityResult.mulAssign(
        mix(float(1.0), pattern!.mul(uInspectingFactor), uGlassMatcap!)
      )
    }

    // --- DAYLIGHT alpha ---

    if (isDaylight) {
      opacityResult.assign(
        mix(opacityResult, uInspectingFactor, uDaylight!)
      )
    }

    return vec4(irradiance, opacityResult)
  })()

  material.colorNode = result.rgb
  material.opacityNode = result.a

  // --- Uniforms compatibility layer ---
  // Consumers access material.uniforms.X.value; TSL nodes have .value natively

  const uniformsCompat: Record<string, any> = {
    uColor,
    uProgress: uniform(0),
    map: uMap,
    mapMatrix: uMapMatrix,
    lightMap: uLightMap,
    lightMapIntensity: uLightMapIntensity,
    aoMap: uAoMap,
    aoMapIntensity: uAoMapIntensity,
    metalness: uniform(baseMaterial.metalness),
    roughness: uniform(baseMaterial.roughness),
    mapRepeat: uMapRepeat,
    baseColor: uBaseColor,
    opacity: uOpacity,
    noiseFactor: uNoiseFactor,
    uTime,
    alphaMap: uAlphaMap,
    alphaMapTransform: uAlphaMapTransform,
    emissive: uEmissive,
    emissiveIntensity: uEmissiveIntensity,
    fogColor: uFogColor,
    fogDensity: uFogDensity,
    fogDepth: uFogDepth,
    glassReflex: uGlassReflex,
    emissiveMap: uEmissiveMap,
    inspectingEnabled: uInspectingEnabled,
    inspectingFactor: uInspectingFactor,
    fadeFactor: uFadeFactor,
    lampLightmap: uLampLightmap,
    lightLampEnabled: uLightLampEnabled
  }

  if (isGodray) {
    uniformsCompat.uGodrayOpacity = uGodrayOpacity!
    uniformsCompat.uGodrayDensity = uGodrayDensity!
  }

  if (isLight || isBasketball) {
    uniformsCompat.lightDirection = uLightDirection!
  }

  if (isBasketball) {
    uniformsCompat.backLightDirection = uBackLightDirection!
  }

  if (isMatcap) {
    uniformsCompat.matcap = uMatcapTex!
    uniformsCompat.glassMatcap = uGlassMatcap!
  }

  if (isDaylight) {
    uniformsCompat.daylight = uDaylight!
  }

  ;(material as any).uniforms = uniformsCompat

  material.needsUpdate = true

  useCustomShaderMaterial
    .getState()
    .addMaterial(material as unknown as ShaderMaterial)

  baseMaterial.dispose()

  return material as unknown as ShaderMaterial
}

interface CustomShaderMaterialStore {
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
