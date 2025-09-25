"use client"

import { useLoader, useThree } from "@react-three/fiber"
import { memo, Suspense, useEffect, useMemo } from "react"
import {
  Group,
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
  const material = update.mesh.material as ShaderMaterial
  material.uniforms.lightMap.value = update.texture
  material.uniforms.lightMapIntensity.value = 1
}

const addAmbientOcclusion = (update: TextureUpdate) => {
  if (!update.mesh.userData.hasGlobalMaterial) return
  const material = update.mesh.material as ShaderMaterial
  material.uniforms.aoMap.value = update.texture
  material.uniforms.aoMapIntensity.value = 1
}

const addMatcap = (update: TextureUpdate, isGlass: boolean) => {
  if (!update.mesh.userData.hasGlobalMaterial) return
  const material = update.mesh.material as ShaderMaterial
  material.uniforms.matcap.value = update.texture
  material.uniforms.glassMatcap.value = isGlass
}

const addReflex = (update: TextureUpdate) => {
  if (!update.mesh.userData.hasGlobalMaterial) return
  const material = update.mesh.material as ShaderMaterial
  material.uniforms.glassReflex.value = update.texture
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
      map.minFilter = NearestFilter
      map.magFilter = NearestFilter
      map.colorSpace = NoColorSpace

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

  console.log(bakes)

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
    // const addMaps = ({ mesh, maps }: { mesh: Mesh; maps: Bake }) => {
    //   if (maps.lightmap) addLightmap({ mesh: mesh, texture: maps.lightmap })
    //   if (maps.aomap) addAmbientOcclusion({ mesh: mesh, texture: maps.aomap })
    //   if (maps.reflex) addReflex({ mesh: mesh, texture: maps.reflex })
    //   if (maps.matcap) {
    //     addMatcap(
    //       { mesh: mesh, texture: maps.matcap.texture },
    //       maps.matcap.isGlass
    //     )
    //   }
    // }
    // Object.entries(bakes).forEach(([mesh, maps]) => {
    //   const meshOrGroup = scene.getObjectByName(mesh)
    //   if (!meshOrGroup) return
    //   if (meshOrGroup instanceof Mesh) {
    //     addMaps({ mesh: meshOrGroup, maps })
    //   } else if (meshOrGroup instanceof Group) {
    //     meshOrGroup.traverse((child) => {
    //       if (child instanceof Mesh) addMaps({ mesh: child, maps })
    //     })
    //   }
    // })
  }, [])

  return null
}

const BakesLoaderInner = () => (
  <Suspense>
    <Bakes />
  </Suspense>
)

export const BakesLoader = memo(BakesLoaderInner)
