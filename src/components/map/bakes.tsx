"use client"

import { useLoader, useThree } from "@react-three/fiber"
import { memo, Suspense, useEffect, useMemo } from "react"
import {
  Group,
  LinearFilter,
  Mesh,
  NearestFilter,
  NoColorSpace,
  Object3D,
  PerspectiveCamera,
  Texture,
  TextureLoader
} from "three"
import type { WebGPURenderer } from "three/webgpu"

import { useAssets } from "@/components/assets-provider"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { cctvConfig } from "@/components/postprocessing/renderer"
import { useKTX2Textures } from "@/hooks/use-ktx2-loader"
import { useMesh } from "@/hooks/use-mesh"
import { markCanvasBootStage } from "@/lib/canvas-boot"
import { useGraphicsLifecycle } from "@/lib/graphics/lifecycle"
import { SiteMaterial } from "@/lib/graphics/material"
import {
  prepareSceneIncrementally,
  registeredScene
} from "@/lib/graphics/preparation"
import { requiredItemGroups, useSceneAssets } from "@/lib/graphics/scene-assets"

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

const addLightmap = (update: TextureUpdate) => {
  if (!update.mesh.userData.hasGlobalMaterial) return
  const material = update.mesh.material as SiteMaterial
  material.uniforms.lightMap.value = update.texture
  material.uniforms.lightMapIntensity.value = 1
}

const addAmbientOcclusion = (update: TextureUpdate) => {
  if (!update.mesh.userData.hasGlobalMaterial) return
  const material = update.mesh.material as SiteMaterial
  material.uniforms.aoMap.value = update.texture
  material.uniforms.aoMapIntensity.value = 1
}

const addMatcap = (update: TextureUpdate, isGlass: boolean) => {
  if (!update.mesh.userData.hasGlobalMaterial) return
  const material = update.mesh.material as SiteMaterial
  material.uniforms.matcap.value = update.texture
  material.uniforms.glassMatcap.value = isGlass
}

const addReflex = (update: TextureUpdate) => {
  if (!update.mesh.userData.hasGlobalMaterial) return
  const material = update.mesh.material as SiteMaterial
  material.uniforms.glassReflex.value = update.texture
}

const useBakes = (names: Set<string>): Record<string, Bake> => {
  const assets = useAssets()
  const bakes = useMemo(
    () => assets.bakes.filter((b) => b.meshes.some((name) => names.has(name))),
    [assets, names]
  )
  const matcaps = useMemo(
    () => assets.matcaps.filter((b) => names.has(b.mesh)),
    [assets, names]
  )
  const glassReflexes = useMemo(
    () => assets.glassReflexes.filter((b) => names.has(b.mesh)),
    [assets, names]
  )

  const withLightmap = useMemo(
    () => bakes.filter((bake) => bake.lightmap),
    [bakes]
  )

  const withAmbientOcclusion = useMemo(
    () => bakes.filter((bake) => bake.ambientOcclusion),
    [bakes]
  )

  // Start independent downloads together before any Suspense reader yields.
  // The renderer-specific HDR decoder and ordinary image decoders can work concurrently.
  useLoader.preload(
    TextureLoader,
    withAmbientOcclusion.map((bake) => bake.ambientOcclusion)
  )
  useLoader.preload(
    TextureLoader,
    matcaps.map((matcap) => matcap.file)
  )
  useLoader.preload(
    TextureLoader,
    glassReflexes.map((reflex) => reflex.url)
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
export const revealOpacityMaterials = new Set<SiteMaterial>()

export const SceneBakes = ({
  root: scene,
  readinessKey,
  objects
}: {
  root: Object3D
  readinessKey: string
  objects?: ReadonlyMap<string, Object3D>
}) => {
  const gl = useThree((state) => state.gl) as unknown as WebGPURenderer
  const assets = useAssets()
  const names = useMemo(() => {
    const names = new Set<string>()
    if (objects) objects.forEach((_, name) => names.add(name))
    else scene.traverse((object) => names.add(object.name))
    return names
  }, [scene, objects])
  const bakes = useBakes(names)
  useEffect(() => {
    let skipped = 0

    const addMaps = ({ mesh, maps }: { mesh: Mesh; maps: Bake }) => {
      if (!mesh.userData.hasGlobalMaterial) {
        skipped++
        return
      }
      if (maps.lightmap) addLightmap({ mesh: mesh, texture: maps.lightmap })
      if (maps.aomap) addAmbientOcclusion({ mesh: mesh, texture: maps.aomap })
      if (maps.reflex) addReflex({ mesh: mesh, texture: maps.reflex })
      if (maps.matcap) {
        addMatcap(
          { mesh: mesh, texture: maps.matcap.texture },
          maps.matcap.isGlass
        )
      }
    }

    Object.entries(bakes).forEach(([mesh, maps]) => {
      const meshOrGroup = objects?.get(mesh) ?? scene.getObjectByName(mesh)
      if (!meshOrGroup) return

      if (meshOrGroup instanceof Mesh) {
        addMaps({ mesh: meshOrGroup, maps })
      } else if (meshOrGroup instanceof Group) {
        meshOrGroup.traverse((child) => {
          if (child instanceof Mesh) addMaps({ mesh: child, maps })
        })
      }
    })

    if (skipped > 0) {
      console.warn(
        `[bakes] ${skipped} mesh(es) had no global shader material; their bakes were dropped.`
      )
    }

    // Reattached bakes can change bindings even after this group was marked ready.
    if (useSceneAssets.getState().ready.has(readinessKey))
      useSceneAssets.getState().markResourcesChanged()

    // Not on mount: bakes can resolve before the models exist.
    let canceled = false
    const generation = useGraphicsLifecycle.getState().generation
    const ready = () => {
      if (!canceled) useSceneAssets.getState().markReady(readinessKey)
    }
    if (
      useAppLoadingStore.getState().canRunMainApp &&
      readinessKey !== "base"
    ) {
      const name = readinessKey === "shared" ? "services" : readinessKey
      const config = assets.scenes.find(
        (scene) => scene.name === name
      )?.cameraConfig
      const camera = new PerspectiveCamera(
        config?.fov ?? 60,
        innerWidth / innerHeight,
        0.1,
        1000
      )
      if (config) {
        camera.position.set(...config.position)
        camera.lookAt(...config.target)
      }
      prepareSceneIncrementally(
        gl,
        registeredScene(gl) ?? scene,
        camera,
        () => canceled,
        undefined,
        () =>
          requiredItemGroups(
            useNavigationStore.getState().currentScene?.name ?? "home"
          ).some((group) => group === readinessKey)
            ? 2
            : 0
      )
        .then(ready)
        .catch((error) => {
          console.error("Scene preparation failed", error)
          if (!canceled) useGraphicsLifecycle.getState().recover(generation)
        })
    } else ready()
    markCanvasBootStage("bakes-resolved")

    const timeout2 = setTimeout(() => (cctvConfig.shouldBakeCCTV = true), 10)

    return () => {
      canceled = true
      clearTimeout(timeout2)
    }
  }, [scene, readinessKey, bakes, gl, assets, objects])

  return null
}

export const BakesLoader = memo(function BakesLoader() {
  const scene = useThree((state) => state.scene)
  const ready = useMesh((state) => state.mapMaterialsReady)
  return ready ? (
    <Suspense fallback={null}>
      <SceneBakes root={scene} readinessKey="base" />
    </Suspense>
  ) : null
})
