"use client"

import { useLoader, useThree } from "@react-three/fiber"
import { memo, Suspense, useEffect, useMemo } from "react"
import {
  Group,
  LinearFilter,
  Mesh,
  NearestFilter,
  NoColorSpace,
  RawShaderMaterial,
  ShaderMaterial,
  Texture,
  TextureLoader
} from "three"
import { EXRLoader } from "three/examples/jsm/Addons.js"

import { useAssets } from "@/components/assets-provider"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { cctvConfig } from "@/components/postprocessing/renderer"
import { useKTX2Texture } from "@/hooks/use-ktx2-texture"

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

const addLightmap = (update: TextureUpdate) => {
  const material = getShaderMaterialWithUniform(update.mesh, "lightMap")
  if (!material) return
  material.uniforms.lightMap.value = update.texture
  material.uniforms.lightMapIntensity.value = 1
}

const addAmbientOcclusion = (update: TextureUpdate) => {
  const material = getShaderMaterialWithUniform(update.mesh, "aoMap")
  if (!material) return
  material.uniforms.aoMap.value = update.texture
  material.uniforms.aoMapIntensity.value = 1
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

// Ambient occlusion has no equivalent in the new merge-by-material pipeline
// yet (no AO pass for the shared atlas). Toggled off here so the old
// per-zone AO jpgs don't render inconsistently next to it — flip back to
// true once there's a real AO story for the atlas.
const AO_ENABLED = false

// Trial: KTX2 (Basis UASTC HDR) atlas instead of EXR. Re-enabled — root
// cause of the earlier "THREE.KTX2Loader: .transcodeImage failed." found:
// public/basis-transcoder/ was self-hosting a STALE transcoder build
// (hash-verified different from the one actually bundled in our own
// node_modules/three), too old to transcode UASTC HDR. Fixed by copying the
// transcoder straight from node_modules/three/examples/jsm/libs/basis/ —
// confirmed byte-identical to the transcoder a separate working ASTC-HDR
// prototype (C:\Users\Tres\Documents\GitHub\basement\Lightmap) uses. Needs
// a fresh visual retest. Both URLs stay wired in the manifest either way.
export const USE_KTX2_LIGHTMAPS = true

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

  const loadedLightmaps = useLoader(
    EXRLoader,
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
      map.flipY = true
      map.generateMipmaps = false
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
      map.minFilter = NearestFilter
      map.magFilter = NearestFilter
      map.colorSpace = NoColorSpace

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
  const bakes = useBakes()
  const atlas = useLightmapAtlas()

  const scene = useThree((state) => state.scene)

  const setMainAppRunning = useAppLoadingStore(
    (state) => state.setMainAppRunning
  )

  const setCanRunMainApp = useAppLoadingStore((state) => state.setCanRunMainApp)

  useEffect(() => {
    setCanRunMainApp(true)
    const timeout = setTimeout(() => {
      setMainAppRunning(true)
    }, 10)
    const timeout2 = setTimeout(() => (cctvConfig.shouldBakeCCTV = true), 10)

    return () => {
      clearTimeout(timeout)
      clearTimeout(timeout2)
    }
  }, [setMainAppRunning, setCanRunMainApp])

  useEffect(() => {
    const addMaps = ({ mesh, maps }: { mesh: Mesh; maps: Bake }) => {
      if (maps.lightmap) addLightmap({ mesh: mesh, texture: maps.lightmap })
      if (AO_ENABLED && maps.aomap) {
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
      if (child.userData.Lightmap !== ATLAS_LIGHTMAP_VALUE) return
      addLightmap({ mesh: child, texture: atlas })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas])

  return null
}

const BakesLoaderInner = () => (
  <Suspense>
    <Bakes />
  </Suspense>
)

export const BakesLoader = memo(BakesLoaderInner)
