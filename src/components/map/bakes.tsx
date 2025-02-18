"use client"

import { useLoader, useThree } from "@react-three/fiber"
import { animate } from "motion"
import { memo, Suspense, useEffect, useMemo } from "react"
import {
  Group,
  Mesh,
  NearestFilter,
  NoColorSpace,
  ShaderMaterial,
  Texture,
  TextureLoader
} from "three"
import { EXRLoader } from "three/examples/jsm/Addons.js"

import { useCustomShaderMaterial } from "@/shaders/material-global-shader"

import { useAssets } from "../assets-provider"

interface Bake {
  lightmap?: Texture
  aomap?: Texture
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
  material.uniforms.lightMapMultiplier.value = 1
}

const addAmbientOcclusion = (update: TextureUpdate) => {
  if (!update.mesh.userData.hasGlobalMaterial) return
  const material = update.mesh.material as ShaderMaterial
  material.uniforms.aoMap.value = update.texture
  material.uniforms.aoMapIntensity.value = 1
  material.uniforms.aoMapMultiplier.value = 1
}

const useBakes = (): Record<string, Bake> => {
  const { bakes } = useAssets()

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

  const meshMaps = useMemo(() => {
    const maps: Record<string, Bake> = {}

    bakes.forEach((bake) => {
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
    })

    return maps
  }, [
    bakes,
    loadedLightmaps,
    loadedAmbientOcclusion,
    withLightmap,
    withAmbientOcclusion
  ])

  return meshMaps
}

const Bakes = () => {
  const shaderMaterialsRef = useCustomShaderMaterial(
    (store) => store.materialsRef
  )

  const bakes = useBakes()

  const scene = useThree((state) => state.scene)

  useEffect(() => {
    animate(0, 1, {
      duration: 1.5,
      ease: "easeIn",
      onUpdate: (latest) => {
        Object.values(shaderMaterialsRef).forEach((material) => {
          material.uniforms.uLoaded.value = latest
        })
      }
    })

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
