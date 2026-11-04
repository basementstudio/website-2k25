"use client"

import { useLoader, useThree } from "@react-three/fiber"
import { memo, Suspense, useEffect, useMemo } from "react"
import {
  Group,
  LinearFilter,
  Mesh,
  NearestFilter,
  NoColorSpace,
  type Object3D,
  RawShaderMaterial,
  ShaderMaterial,
  Texture,
  TextureLoader
} from "three"
import { EXRLoader } from "three/examples/jsm/Addons.js"

import { useAssets } from "@/components/assets-provider"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { cctvConfig } from "@/components/postprocessing/renderer"
import { useKTX2Textures } from "@/hooks/use-ktx2-loader"
import { useKTX2Texture } from "@/hooks/use-ktx2-texture"
import { useMesh } from "@/hooks/use-mesh"
import { INSPECTABLES_META } from "@/lib/3d-config/inspectables-meta"
import { markCanvasBootStage } from "@/lib/canvas-boot"

import {
  atlasAoIntensity,
  atlasLightmapGamma,
  atlasLightmapIntensity,
  atlasLightmapSaturation
} from "./lightmap-settings"

interface Bake {
  lightmap?: Texture
  aomap?: Texture
  matcap?: {
    texture: Texture
    isGlass: boolean
  }
  reflex?: Texture
}

interface TextureUpdate {
  mesh: Mesh
  texture: Texture
  intensity?: number
}

// Some materials only get a given uniform when a matching #define was set
// at creation (e.g. "matcap" only exists if MATCAP was true) — and a mesh
// could in theory carry hasGlobalMaterial without the uniform we expect (a
// stale/array material, a special-case material like the CCTV one, etc).
// Warn with the mesh name instead of crashing so a mismatch is diagnosable.
const getShaderMaterialWithUniform = (
  mesh: Mesh,
  uniformKey: string
): ShaderMaterial | null => {
  if (!mesh.userData.hasGlobalMaterial) return null
  const material = mesh.material
  if (
    Array.isArray(material) ||
    !(material as ShaderMaterial)?.uniforms?.[uniformKey]
  ) {
    console.warn(
      `[bakes] "${mesh.name}" has hasGlobalMaterial but no "${uniformKey}" uniform — skipping`
    )
    return null
  }
  return material as ShaderMaterial
}

// Moving clock hands keep their authored color texture without the static bake.
const CLOCK_HANDS_WITHOUT_LIGHTMAP = new Set([
  "SM_HourHand",
  "SM_MinuterHand",
  "SM_Second"
])

const addLightmap = (update: TextureUpdate) => {
  const material = getShaderMaterialWithUniform(update.mesh, "lightMap")
  if (!material) return
  if (CLOCK_HANDS_WITHOUT_LIGHTMAP.has(update.mesh.name)) {
    material.uniforms.lightMapEnabled.value = false
    material.uniforms.lightMapIntensity.value = 0
    // Small neutral brightness lift, preserving the texture's detail.
    material.uniforms.baseColor.value.setRGB(1.2, 1.2, 1.2)
    return
  }
  material.uniforms.lightMap.value = update.texture
  material.uniforms.lightMapEnabled.value = true
  material.uniforms.lightMapIntensity =
    update.mesh.userData.Lightmap === "Map00"
      ? atlasLightmapIntensity
      : { value: update.intensity ?? 1 }
  if (update.mesh.userData.Lightmap === "Map00") {
    material.uniforms.lightMapSaturation = atlasLightmapSaturation
    material.uniforms.lightMapGamma = atlasLightmapGamma
  }
}

const AO_EXCLUDED_ROOTS = new Set([
  ...INSPECTABLES_META.map(({ mesh }) => mesh),
  "shirt",
  "SM_KitCat"
])

const addAmbientOcclusion = (
  update: TextureUpdate,
  intensity = 1,
  useSecondUv = false
) => {
  const material = getShaderMaterialWithUniform(update.mesh, "aoMap")
  if (!material) return
  // Exclude these complete objects and their children, including at rest.
  for (let node: Object3D | null = update.mesh; node; node = node.parent) {
    if (AO_EXCLUDED_ROOTS.has(node.name)) {
      // Detach from the shared slider uniform when updating an existing material.
      material.uniforms.aoMapIntensity = { value: 0 }
      return
    }
  }
  material.uniforms.aoMap.value = update.texture
  material.uniforms.aoUseSecondUv.value = useSecondUv
  material.uniforms.aoMapIntensity =
    useSecondUv || update.mesh.userData.Lightmap === "Map00"
      ? atlasAoIntensity
      : { value: intensity }
}

const addMatcap = (update: TextureUpdate, isGlass: boolean) => {
  const material = getShaderMaterialWithUniform(update.mesh, "matcap")
  if (!material) return
  material.uniforms.matcap.value = update.texture
  material.uniforms.glassMatcap.value = isGlass
}

const addReflex = (update: TextureUpdate) => {
  const material = getShaderMaterialWithUniform(update.mesh, "glassReflex")
  if (!material) return
  material.uniforms.glassReflex.value = update.texture
}

// Merge-by-material meshes carry a "Lightmap" custom property (exported from
// Blender, read at runtime as mesh.userData.Lightmap) instead of being
// listed by name in a bakes[] group below. Right now the only value that
// resolves here is "Map00", the shared atlas — "Map01" (the blog lamp) is
// handled separately in lamp/index.tsx since those meshes don't carry the
// atlas UV set (TEXCOORD_2) at all, only their own dedicated on/off sheets.
const ATLAS_LIGHTMAP_VALUE = "Map00"

// Legacy per-mesh AO stays disabled. The shared Map00 atlas is applied
// separately below using the same UV set as its lightmap.
const LEGACY_AO_ENABLED = false

// Trial: KTX2 (Basis UASTC HDR) atlas instead of EXR. Re-enabled — root
// cause of the earlier "THREE.KTX2Loader: .transcodeImage failed." found:
// public/basis-transcoder/ was self-hosting a STALE transcoder build
// (hash-verified different from the one actually bundled in our own
// node_modules/three), too old to transcode UASTC HDR. Fixed by copying the
// transcoder straight from node_modules/three/examples/jsm/libs/basis/ —
// confirmed byte-identical to the transcoder a separate working ASTC-HDR
// prototype (C:\Users\Tres\Documents\GitHub\basement\Lightmap) uses. Needs
// a fresh visual retest. Both URLs stay wired in the manifest either way.
// Was flipped false (Sep 10) while the AO trial's fresh EXR re-bake had no
// matching KTX2 — re-enabled now that a fresh Map00.ktx2 landed for it.
// Test MAP00-go4_end.exr with the G04 office.
export const USE_KTX2_LIGHTMAPS = false

const useLightmapAtlas = (): Texture => {
  const { lightmapAtlas, lightmapAtlasKtx2 } = useAssets()

  if (USE_KTX2_LIGHTMAPS) {
    return useKtx2LightmapAtlas(lightmapAtlasKtx2)
  }

  return useExrLightmapAtlas(lightmapAtlas)
}

const useKtx2LightmapAtlas = (url: string): Texture => {
  const atlas = useKTX2Texture(url)

  useEffect(() => {
    // NOTE: CompressedTexture.flipY is read-only (always false) — three.js
    // can't flip pre-compressed block data on upload the way it can a plain
    // DataTexture. If this atlas renders vertically flipped vs. the EXR
    // version, the fix has to happen at export time (bake/orientation), not
    // here — worth a specific visual check on first test.
    atlas.colorSpace = NoColorSpace
    atlas.minFilter = LinearFilter
    atlas.magFilter = LinearFilter
    atlas.needsUpdate = true
  }, [atlas])

  return atlas
}

const useExrLightmapAtlas = (url: string): Texture => {
  const atlas = useLoader(EXRLoader, url)

  useEffect(() => {
    atlas.flipY = true
    atlas.generateMipmaps = false
    atlas.minFilter = LinearFilter
    atlas.magFilter = LinearFilter
    atlas.colorSpace = NoColorSpace
    atlas.needsUpdate = true
  }, [atlas])

  return atlas
}

const useAtlasAmbientOcclusion = (url: string): Texture => {
  const ao = useLoader(TextureLoader, url)

  useEffect(() => {
    // TextureLoader's Texture already defaults flipY=true (unlike EXRLoader's
    // DataTexture, which defaults false and needs the explicit override in
    // useExrLightmapAtlas above) — so this bake needed the opposite of that
    // default to line up with the lightmap it shares a UV layout with.
    ao.flipY = false
    ao.generateMipmaps = false
    ao.minFilter = LinearFilter
    ao.magFilter = LinearFilter
    ao.colorSpace = NoColorSpace
    ao.needsUpdate = true
  }, [ao])

  return ao
}

const useBakes = (): Record<string, Bake> => {
  const { bakes, matcaps, glassReflexes } = useAssets()

  const withLightmap = useMemo(
    () => bakes.filter((bake) => bake.lightmap),
    [bakes]
  )

  const withAmbientOcclusion = useMemo(
    () => bakes.filter((bake) => bake.ambientOcclusion),
    [bakes]
  )

  const loadedLightmaps = useKTX2Textures(
    withLightmap.map((bake) => bake.lightmap)
  )

  const loadedAmbientOcclusion = useLoader(
    TextureLoader,
    withAmbientOcclusion.map((bake) => bake.ambientOcclusion)
  )

  const loadedMatcaps = useLoader(
    TextureLoader,
    matcaps.map((matcap) => matcap.file)
  )

  const loadedReflexes = useLoader(
    TextureLoader,
    glassReflexes.map((reflex) => reflex.url)
  )

  const meshMaps = useMemo(() => {
    const maps: Record<string, Bake> = {}

    loadedLightmaps.forEach((map, index) => {
      const meshNames = withLightmap[index].meshes
      map.generateMipmaps = false
      // linear so baked lighting reads as smooth gradients instead of
      // texel stair-steps
      map.minFilter = LinearFilter
      map.magFilter = LinearFilter
      map.colorSpace = NoColorSpace
      map.needsUpdate = true

      for (const meshName of meshNames) {
        if (!maps[meshName]) {
          maps[meshName] = {}
        }
        maps[meshName].lightmap = map
      }
    })

    loadedAmbientOcclusion.forEach((map, index) => {
      const meshNames = withAmbientOcclusion[index].meshes
      map.flipY = false
      map.generateMipmaps = false
      // linear like the lightmaps — AO is part of the baked shading and
      // shows the same texel stair-steps at Nearest
      map.minFilter = LinearFilter
      map.magFilter = LinearFilter
      map.colorSpace = NoColorSpace
      map.needsUpdate = true

      for (const meshName of meshNames) {
        if (!maps[meshName]) {
          maps[meshName] = {}
        }
        maps[meshName].aomap = map
      }
    })

    loadedMatcaps.forEach((map, index) => {
      map.flipY = false
      map.generateMipmaps = false
      map.minFilter = NearestFilter
      map.magFilter = NearestFilter
      map.colorSpace = NoColorSpace
      if (!maps[matcaps[index].mesh]) {
        maps[matcaps[index].mesh] = {}
      }
      maps[matcaps[index].mesh].matcap = {
        texture: map,
        isGlass: matcaps[index].isGlass
      }
    })

    loadedReflexes.forEach((map, index) => {
      map.flipY = false
      map.colorSpace = NoColorSpace
      map.generateMipmaps = false
      map.minFilter = NearestFilter
      map.magFilter = NearestFilter

      const meshName = glassReflexes[index].mesh
      if (!maps[meshName]) {
        maps[meshName] = {}
      }
      maps[meshName].reflex = map
    })

    return maps
  }, [
    loadedLightmaps,
    loadedAmbientOcclusion,
    withLightmap,
    withAmbientOcclusion,
    matcaps,
    loadedMatcaps,
    loadedReflexes,
    glassReflexes
  ])

  return meshMaps
}

/** Attach a material to this array and it will change its uOpacity onLoad */
export const revealOpacityMaterials = new Set<
  ShaderMaterial | RawShaderMaterial
>()

const Bakes = () => {
  const { lightmapAtlasAo, ao1Atlas } = useAssets()
  const bakes = useBakes()
  const atlas = useLightmapAtlas()
  const atlasAo = useAtlasAmbientOcclusion(lightmapAtlasAo)
  const ao1 = useAtlasAmbientOcclusion(ao1Atlas)

  const scene = useThree((state) => state.scene)

  const setMainAppRunning = useAppLoadingStore(
    (state) => state.setMainAppRunning
  )

  const setCanRunMainApp = useAppLoadingStore((state) => state.setCanRunMainApp)

  useEffect(() => {
    markCanvasBootStage("bakes-resolved")
  }, [])

  const mapMaterialsReady = useMesh((state) => state.mapMaterialsReady)

  useEffect(() => {
    if (!mapMaterialsReady) return

    let skipped = 0

    const addMaps = ({ mesh, maps }: { mesh: Mesh; maps: Bake }) => {
      if (!mesh.userData.hasGlobalMaterial) {
        skipped++
        return
      }
      if (maps.lightmap) addLightmap({ mesh: mesh, texture: maps.lightmap })
      if (LEGACY_AO_ENABLED && maps.aomap) {
        addAmbientOcclusion({ mesh: mesh, texture: maps.aomap })
      }
      if (maps.reflex) addReflex({ mesh: mesh, texture: maps.reflex })
      if (maps.matcap) {
        addMatcap(
          { mesh: mesh, texture: maps.matcap.texture },
          maps.matcap.isGlass
        )
      }
    }

    Object.entries(bakes).forEach(([mesh, maps]) => {
      const meshOrGroup = scene.getObjectByName(mesh)
      if (!meshOrGroup) return

      if (meshOrGroup instanceof Mesh) {
        addMaps({ mesh: meshOrGroup, maps })
      } else if (meshOrGroup instanceof Group) {
        meshOrGroup.traverse((child) => {
          if (child instanceof Mesh) addMaps({ mesh: child, maps })
        })
      }
    })

    // Merge-by-material pipeline: any mesh self-tagged with the shared atlas
    // via its "Lightmap" custom property, found by traversal instead of a
    // hand-maintained name list.
    scene.traverse((child) => {
      if (!(child instanceof Mesh)) return
      const hasLightmap = child.userData.Lightmap === ATLAS_LIGHTMAP_VALUE
      const hasAo1 = child.userData.AO === "AO1"
      if (!hasLightmap && !hasAo1) return
      if (!child.userData.hasGlobalMaterial) {
        skipped++
        return
      }
      if (hasLightmap) addLightmap({ mesh: child, texture: atlas })
      if (hasAo1) {
        if (child.geometry.hasAttribute("uv1")) {
          addAmbientOcclusion({ mesh: child, texture: ao1 }, 1, true)
        } else {
          console.warn(`[bakes] ${child.name}: AO1 requires TEXCOORD_1`)
        }
      } else {
        addAmbientOcclusion({ mesh: child, texture: atlasAo })
      }
    })

    if (skipped > 0) {
      console.warn(
        `[bakes] ${skipped} mesh(es) had no global shader material; their bakes were dropped.`
      )
    }

    // Not on mount: bakes can resolve before the models exist.
    setCanRunMainApp(true)
    const timeout = setTimeout(() => setMainAppRunning(true), 10)
    const timeout2 = setTimeout(() => (cctvConfig.shouldBakeCCTV = true), 10)

    return () => {
      clearTimeout(timeout)
      clearTimeout(timeout2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas, atlasAo, ao1, mapMaterialsReady, bakes])

  return null
}

const BakesLoaderInner = () => (
  <Suspense>
    <Bakes />
  </Suspense>
)

export const BakesLoader = memo(BakesLoaderInner)
