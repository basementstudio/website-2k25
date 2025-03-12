"use client"

import { useLoader, useThree } from "@react-three/fiber"
import { animate } from "motion"
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
import { useCustomShaderMaterial } from "@/shaders/material-global-shader"

import { useAppLoadingStore } from "../loading/app-loading-handler"
import { cctvConfig } from "../postprocessing/renderer"

interface Bake {
  lightmap?: Texture
  aomap?: Texture
  matcap?: {
    texture: Texture
    isGlass: boolean
  }
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

const useBakes = (): Record<string, Bake> => {
  const { bakes, matcaps } = useAssets()

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
      if (!maps[matcaps[index].mesh]) {
        maps[matcaps[index].mesh] = {}
      }
      maps[matcaps[index].mesh].matcap = {
        texture: map,
        isGlass: matcaps[index].isGlass
      }
    })

    return maps
  }, [
    loadedLightmaps,
    loadedAmbientOcclusion,
    withLightmap,
    withAmbientOcclusion,
    matcaps,
    loadedMatcaps
  ])

  return meshMaps
}

/** Attach a material to this array and it will change its uOpacity onLoad */
export const revealOpacityMaterials = new Set<
  ShaderMaterial | RawShaderMaterial
>()

const Bakes = () => {
  const shaderMaterialsRef = useCustomShaderMaterial(
    (store) => store.materialsRef
  )

  const bakes = useBakes()

  const scene = useThree((state) => state.scene)

  const setMainAppRunning = useAppLoadingStore(
    (state) => state.setMainAppRunning
  )

  useEffect(() => {
    setMainAppRunning(true)
    const timeout = setTimeout(() => {
      cctvConfig.shouldBakeCCTV = true
    }, 10)

    return () => {
      clearTimeout(timeout)
    }
  }, [setMainAppRunning])

  useEffect(() => {
    Object.entries(bakes).forEach(([mesh, maps]) => {
      const meshOrGroup = scene.getObjectByName(mesh)
      if (!meshOrGroup) return

      if (meshOrGroup instanceof Mesh) {
        if (maps.lightmap) {
          addLightmap({
            mesh: meshOrGroup,
            texture: maps.lightmap
          })
        }
        if (maps.aomap) {
          addAmbientOcclusion({
            mesh: meshOrGroup,
            texture: maps.aomap
          })
        }
        if (maps.matcap) {
          addMatcap(
            {
              mesh: meshOrGroup,
              texture: maps.matcap.texture
            },
            maps.matcap.isGlass
          )
        }
      } else if (meshOrGroup instanceof Group) {
        meshOrGroup.traverse((child) => {
          if (child instanceof Mesh) {
            if (maps.lightmap) {
              addLightmap({
                mesh: child,
                texture: maps.lightmap
              })
            }
            if (maps.aomap) {
              addAmbientOcclusion({
                mesh: child,
                texture: maps.aomap
              })
            }
            if (maps.matcap) {
              addMatcap(
                {
                  mesh: child,
                  texture: maps.matcap.texture
                },
                maps.matcap.isGlass
              )
            }
          }
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

const BakesLoaderInner = () => (
  <Suspense>
    <Bakes />
  </Suspense>
)

export const BakesLoader = memo(BakesLoaderInner)
